import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "bun:test";

async function scripts(): Promise<Record<string, string>> {
  const raw = await readFile(join(import.meta.dir, "..", "package.json"), "utf8");
  const pkg = JSON.parse(raw) as { scripts: Record<string, string> };
  return pkg.scripts;
}

test("el build depende de verify y verify corre typecheck antes que los tests", async () => {
  const pkg = await scripts();
  const verify = pkg.verify ?? "";
  const build = pkg.build ?? "";
  expect(pkg.test).toBe("bun test");
  expect(pkg.typecheck).toBe("bun check");
  expect(verify).toContain("bun run typecheck");
  expect(verify).toContain("bun test");
  expect(verify.indexOf("bun run typecheck")).toBeLessThan(verify.indexOf("bun test"));
  expect(build).toContain("bun run verify");
  expect(build.indexOf("bun run verify")).toBeLessThan(build.indexOf("bun build"));
});
