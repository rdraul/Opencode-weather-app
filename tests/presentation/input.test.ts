import { join } from "node:path";
import { expect, test } from "bun:test";
import { EndOfInput, ask } from "../../src/presentation/input";
import { captureStdout, fakeReader } from "../helpers";

test("ask escribe el prompt y devuelve la línea recortada", async () => {
  const stdout = captureStdout();
  try {
    const answer = await ask(fakeReader(["  Ottawa  "]), "  Ciudad: ");
    expect(answer).toBe("Ottawa");
    expect(stdout.written).toEqual(["  Ciudad: "]);
  } finally {
    stdout.restore();
  }
});

test("ask lanza EndOfInput cuando se agotó la entrada", async () => {
  const stdout = captureStdout();
  try {
    await expect(ask(fakeReader([]), "  Ciudad: ")).rejects.toBeInstanceOf(EndOfInput);
  } finally {
    stdout.restore();
  }
});

test("fakeReader consume las líneas en orden y devuelve null al terminar", async () => {
  const reader = fakeReader(["a", "b"]);
  expect(await reader.next()).toBe("a");
  expect(await reader.next()).toBe("b");
  expect(await reader.next()).toBeNull();
  reader.close();
});

test("createLineReader conserva todas las líneas de stdin pipeado", async () => {
  const fixture = join(import.meta.dir, "..", "fixtures", "line-reader.ts");
  const child = Bun.spawn([process.execPath, "run", fixture], {
    cwd: join(import.meta.dir, "..", ".."),
    stdin: new Blob(["uno\ndos\ntres\n"]),
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  expect(exitCode).toBe(0);
  expect(stderr).toBe("");
  expect(JSON.parse(stdout.trim())).toEqual(["uno", "dos", "tres"]);
});
