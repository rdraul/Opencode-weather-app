import { afterEach, beforeEach, expect, test } from "bun:test";
import { cyan, green, paint, red, yellow } from "../src/color";

const originalNoColor = process.env.NO_COLOR;
const originalForceColor = process.env.FORCE_COLOR;

beforeEach(() => {
  delete process.env.NO_COLOR;
  process.env.FORCE_COLOR = "1";
});

afterEach(() => {
  if (originalNoColor === undefined) delete process.env.NO_COLOR;
  else process.env.NO_COLOR = originalNoColor;
  if (originalForceColor === undefined) delete process.env.FORCE_COLOR;
  else process.env.FORCE_COLOR = originalForceColor;
});

test("cada helper usa su código ANSI y termina con reset", () => {
  expect(cyan("menú")).toBe("\x1b[36mmenú\x1b[0m");
  expect(yellow("12.0 °C")).toBe("\x1b[33m12.0 °C\x1b[0m");
  expect(green("listo")).toBe("\x1b[32mlisto\x1b[0m");
  expect(red("falló")).toBe("\x1b[31mfalló\x1b[0m");
});

test("NO_COLOR desactiva los colores aunque haya FORCE_COLOR", () => {
  process.env.NO_COLOR = "1";
  expect(paint("mensaje", "red")).toBe("mensaje");
});

test("FORCE_COLOR=0 desactiva los colores", () => {
  process.env.FORCE_COLOR = "0";
  expect(paint("mensaje", "green")).toBe("mensaje");
});

test("paint no emite códigos para texto vacío", () => {
  expect(paint("", "cyan")).toBe("");
});
