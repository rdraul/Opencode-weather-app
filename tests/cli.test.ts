import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, expect, test } from "bun:test";
import { stripAnsi, tempConfigDir } from "./helpers";

const ROOT = join(import.meta.dir, "..");
const ENTRY = join(ROOT, "index.ts");

let env: Awaited<ReturnType<typeof tempConfigDir>>;

beforeEach(async () => {
  env = await tempConfigDir();
  await Bun.write(
    join(env.dir, "config.json"),
    `${JSON.stringify({ cities: [], defaultCityId: null, unit: "celsius" })}\n`,
  );
});

afterEach(async () => {
  await env.cleanup();
});

async function runCli(input: string): Promise<{ stdout: string; stderr: string; code: number }> {
  const child = Bun.spawn([process.execPath, "run", ENTRY], {
    cwd: ROOT,
    stdin: new Blob([input]),
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, WEATHER_CONFIG_DIR: env.dir, NO_COLOR: "1" },
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  return { stdout, stderr, code };
}

test("runCli procesa varias líneas pipeadas, guarda el cambio y sale", async () => {
  const { stdout, stderr, code } = await runCli("8\n9\n");
  expect(code).toBe(0);
  expect(stderr).toBe("");
  const output = stripAnsi(stdout);
  expect(output).toContain("WEATHER CLI");
  expect(output).toContain("Unidad configurada: °F");
  expect(output).toContain("¡Hasta luego!");
  const saved = JSON.parse(await readFile(join(env.dir, "config.json"), "utf8")) as {
    unit: string;
  };
  expect(saved.unit).toBe("fahrenheit");
});

test("runCli rechaza una opción desconocida y continúa hasta Salir", async () => {
  const { stdout, code } = await runCli("7\n9\n");
  expect(code).toBe(0);
  const output = stripAnsi(stdout);
  expect(output).toContain("Opción no válida.");
  expect(output).toContain("¡Hasta luego!");
});
