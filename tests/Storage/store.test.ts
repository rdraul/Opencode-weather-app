import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { addCity, getDefaultCity, removeCity, setDefaultCity } from "../../src/Storage/CityStorage";
import {
  defaultConfig,
  loadConfig,
  saveConfig,
  toggleUnit,
} from "../../src/Storage/settingsStorage";
import type { City } from "../../src/tipos/City";

const originalDir = process.env.WEATHER_CONFIG_DIR;
let dir: string;

const ottawa: City = {
  id: 1,
  name: "Ottawa",
  latitude: 45.41117,
  longitude: -75.69812,
};

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "weather-cli-test-"));
  process.env.WEATHER_CONFIG_DIR = dir;
});

afterEach(async () => {
  if (originalDir === undefined) delete process.env.WEATHER_CONFIG_DIR;
  else process.env.WEATHER_CONFIG_DIR = originalDir;
  await rm(dir, { recursive: true, force: true });
});

test("loadConfig devuelve el estado inicial si no hay archivo", async () => {
  expect(await loadConfig()).toEqual(defaultConfig());
});

test("saveConfig y loadConfig conservan ciudades, default y unidad", async () => {
  const config = {
    ...defaultConfig(),
    cities: [ottawa],
    defaultCityId: ottawa.id,
    unit: "fahrenheit" as const,
  };
  await saveConfig(config);
  expect(await loadConfig()).toEqual(config);
});

test("addCity no duplica por id", () => {
  const config = { ...defaultConfig(), cities: [ottawa] };
  expect(addCity(config, ottawa)).toBe(config);
  expect(addCity(config, { ...ottawa, id: 2, name: "Gatineau" }).cities).toHaveLength(2);
});

test("removeCity limpia el default cuando corresponde", () => {
  const config = { ...defaultConfig(), cities: [ottawa], defaultCityId: ottawa.id };
  expect(removeCity(config, ottawa.id).defaultCityId).toBeNull();
});

test("setDefaultCity ignora ids que no están guardados", () => {
  const config = defaultConfig();
  expect(setDefaultCity(config, 99)).toBe(config);
});

test("toggleUnit alterna entre celsius y fahrenheit", () => {
  expect(toggleUnit(defaultConfig()).unit).toBe("fahrenheit");
  expect(toggleUnit({ ...defaultConfig(), unit: "fahrenheit" }).unit).toBe("celsius");
});

test("getDefaultCity devuelve la ciudad default o undefined", () => {
  const config = { ...defaultConfig(), cities: [ottawa], defaultCityId: ottawa.id };
  expect(getDefaultCity(config)).toBe(ottawa);
  expect(getDefaultCity({ ...config, defaultCityId: 99 })).toBeUndefined();
  expect(getDefaultCity(defaultConfig())).toBeUndefined();
});

test("loadConfig sanea ciudades, default y unidad inválidos", async () => {
  await Bun.write(
    `${dir}/config.json`,
    JSON.stringify({
      cities: [ottawa, { id: "x", name: "Inválida" }, { ...ottawa, id: 2 }],
      defaultCityId: 99,
      unit: "kelvin",
    }),
  );
  expect(await loadConfig()).toEqual({
    cities: [ottawa, { ...ottawa, id: 2 }],
    defaultCityId: null,
    unit: "celsius",
  });
});

test("loadConfig rechaza JSON corrupto y estructuras inválidas", async () => {
  await Bun.write(`${dir}/config.json`, "{ esto no es json");
  await expect(loadConfig()).rejects.toThrow("No se pudo interpretar la configuración");

  await Bun.write(`${dir}/config.json`, "[]");
  await expect(loadConfig()).rejects.toThrow("No se pudo interpretar la configuración");
});

test("saveConfig escribe de forma atómica sin dejar temporales", async () => {
  const config = { ...defaultConfig(), cities: [ottawa], defaultCityId: ottawa.id };
  await saveConfig(config);
  const files = await readdir(dir);
  expect(files).toEqual(["config.json"]);
  expect(await loadConfig()).toEqual(config);
});
