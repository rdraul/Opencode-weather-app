import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  addCity,
  defaultConfig,
  loadConfig,
  removeCity,
  saveConfig,
  setDefaultCity,
  toggleUnit,
} from "../src/store";
import type { City } from "../src/types";

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
