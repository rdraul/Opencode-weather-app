import { expect, test } from "bun:test";
import { getMenuOptions, renderMenu } from "../../src/presentation/menu";
import { LINE } from "../../src/utils/constantes";
import { makeCity, makeConfig, stripAnsi } from "../helpers";

test("getMenuOptions devuelve las claves del menú del README", () => {
  const options = getMenuOptions(makeConfig());
  expect(options.map((option) => option.key)).toEqual(["1", "2", "3", "4", "5", "6", "8", "9"]);
  expect(options.map((option) => option.label)).toContain("Salir");
});

test("getMenuOptions refleja la cantidad de ciudades y la unidad", () => {
  const config = makeConfig({
    cities: [makeCity(), makeCity({ id: 2, name: "Gatineau" })],
    unit: "fahrenheit",
  });
  const options = getMenuOptions(config);
  expect(options.find((option) => option.key === "2")?.label).toBe(
    "Clima de todas las ciudades (2)",
  );
  expect(options.find((option) => option.key === "8")?.label).toBe("Ajustes (°F)");
});

test("renderMenu dibuja el título, las opciones y la línea decorativa", () => {
  const menu = stripAnsi(renderMenu(makeConfig()));
  expect(menu.split(LINE)).toHaveLength(4);
  expect(menu).toContain("WEATHER CLI");
  expect(menu).toContain("  1. Clima de ciudad default");
  expect(menu).toContain("  9. Salir");
});
