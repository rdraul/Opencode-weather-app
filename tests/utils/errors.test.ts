import { expect, test } from "bun:test";
import { errorMessage } from "../../src/utils/errors";

test("errorMessage extrae el mensaje de Error", () => {
  expect(errorMessage(new Error("falló la consulta"))).toBe("falló la consulta");
});

test("errorMessage convierte otros valores a texto", () => {
  expect(errorMessage("texto plano")).toBe("texto plano");
  expect(errorMessage(42)).toBe("42");
  expect(errorMessage(null)).toBe("null");
});
