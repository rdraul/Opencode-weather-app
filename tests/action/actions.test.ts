import { afterEach, beforeEach, expect, test } from "bun:test";
import { addCityFlow } from "../../src/action/addCity";
import { showForecastFlow } from "../../src/action/getForecast";
import { showAllCitiesWeather, showDefaultWeather } from "../../src/action/getWeather";
import { listCities } from "../../src/action/listCities";
import { removeCityFlow } from "../../src/action/removeCity";
import { setDefaultCityFlow } from "../../src/action/setDefaultCity";
import { toggleUnitFlow } from "../../src/action/toggleUnit";
import { loadConfig } from "../../src/Storage/settingsStorage";
import {
  captureConsole,
  captureStdout,
  fakeReader,
  makeCity,
  makeConfig,
  stubFetch,
  stubJson,
  stripAnsi,
  tempConfigDir,
} from "../helpers";

let env: Awaited<ReturnType<typeof tempConfigDir>>;
let logs: ReturnType<typeof captureConsole>;
let stdout: ReturnType<typeof captureStdout>;
let restoreFetch: () => void;

beforeEach(async () => {
  env = await tempConfigDir();
  logs = captureConsole();
  stdout = captureStdout();
  restoreFetch = () => {};
});

afterEach(async () => {
  restoreFetch();
  stdout.restore();
  logs.restore();
  await env.cleanup();
});

function useJson(payload: unknown): ReturnType<typeof stubJson> {
  const stub = stubJson(payload);
  restoreFetch = stub.restore;
  return stub;
}

function forbidFetch(): ReturnType<typeof stubFetch> {
  const stub = stubFetch(() => {
    throw new Error("No se debería consultar la API");
  });
  restoreFetch = stub.restore;
  return stub;
}

function lines(): string[] {
  return logs.lines.map(stripAnsi);
}

const GEOCODING_OK = {
  results: [
    {
      id: 1,
      name: "Ottawa",
      latitude: 45.41117,
      longitude: -75.69812,
      country: "Canadá",
      admin1: "Ontario",
    },
  ],
};

const FORECAST_OK = {
  daily: {
    time: Array.from({ length: 7 }, (_, index) => `2026-11-${23 + index}`),
    temperature_2m_max: [10, 11, 12, 13, 14, 15, 16],
    temperature_2m_min: [2, 3, 4, 5, 6, 7, 8],
    weather_code: [0, 1, 2, 3, 61, 95, 0],
  },
};

test("addCityFlow ignora un nombre vacío sin consultar ni guardar", async () => {
  const stub = forbidFetch();
  const config = makeConfig();
  expect(await addCityFlow(fakeReader(["   "]), config)).toBe(config);
  expect(stub.requests).toHaveLength(0);
});

test("addCityFlow agrega, persiste y anuncia la ciudad", async () => {
  const stub = useJson(GEOCODING_OK);
  const config = makeConfig();
  const next = await addCityFlow(fakeReader(["  Ottawa  "]), config);
  expect(next).not.toBe(config);
  expect(next.cities).toEqual([makeCity()]);
  expect(await loadConfig()).toEqual(next);
  expect(lines().some((line) => line.includes("Ciudad agregada: Ottawa, Ontario, Canadá"))).toBe(
    true,
  );
  expect(stub.requests).toHaveLength(1);
});

test("addCityFlow no duplica una ciudad ya guardada", async () => {
  useJson(GEOCODING_OK);
  const config = makeConfig({ cities: [makeCity()] });
  expect(await addCityFlow(fakeReader(["Ottawa"]), config)).toBe(config);
  expect(lines().some((line) => line.includes("ya estaba guardada"))).toBe(true);
});

test("addCityFlow muestra el error de geocoding y conserva la config", async () => {
  useJson({ results: [] });
  const config = makeConfig();
  expect(await addCityFlow(fakeReader(["CiudadInventada"]), config)).toBe(config);
  expect(lines()).toContain('  No encontré la ciudad "CiudadInventada".');
});

test("removeCityFlow elimina y persiste la ciudad elegida", async () => {
  const first = makeCity();
  const second = makeCity({ id: 2, name: "Gatineau", country: undefined, admin1: undefined });
  const config = makeConfig({ cities: [first, second], defaultCityId: first.id });
  const next = await removeCityFlow(fakeReader(["2"]), config);
  expect(next.cities).toEqual([first]);
  expect(next.defaultCityId).toBe(first.id);
  expect(await loadConfig()).toEqual(next);
  expect(lines()).toContain("  Ciudad eliminada: Gatineau");
});

test("setDefaultCityFlow cambia y persiste la ciudad default", async () => {
  const first = makeCity();
  const second = makeCity({ id: 2, name: "Gatineau" });
  const config = makeConfig({ cities: [first, second] });
  const next = await setDefaultCityFlow(fakeReader(["1"]), config);
  expect(next.defaultCityId).toBe(first.id);
  expect(await loadConfig()).toEqual(next);
  expect(lines()).toContain("  Ciudad default: Ottawa, Ontario, Canadá");
});

test("toggleUnitFlow alterna y persiste la unidad", async () => {
  const next = await toggleUnitFlow(makeConfig());
  expect(next.unit).toBe("fahrenheit");
  expect(await loadConfig()).toEqual(next);
  expect(lines()).toContain("  Unidad configurada: °F");
});

test("showDefaultWeather avisa cuando no hay ciudad default", async () => {
  const stub = forbidFetch();
  await showDefaultWeather(makeConfig());
  expect(stub.requests).toHaveLength(0);
  expect(lines()[0]).toBe(
    "  Aún no hay ciudad default. Usa la opción 3 para agregar o la 5 para elegir.",
  );
});

test("showDefaultWeather imprime el clima de la ciudad default", async () => {
  useJson({ current: { temperature_2m: 20 } });
  const city = makeCity({ country: undefined, admin1: undefined });
  await showDefaultWeather(makeConfig({ cities: [city], defaultCityId: city.id }));
  expect(lines()).toContain("  Ottawa: 20.0 °C");
});

test("showAllCitiesWeather avisa cuando no hay ciudades", async () => {
  const stub = forbidFetch();
  await showAllCitiesWeather(makeConfig());
  expect(stub.requests).toHaveLength(0);
  expect(lines()[0]).toBe("  No hay ciudades guardadas. Usa la opción 3 para agregar una.");
});

test("showAllCitiesWeather imprime el clima de cada ciudad", async () => {
  useJson({ current: { temperature_2m: 5 } });
  const cities = [
    makeCity({ id: 1, name: "Ottawa", country: undefined, admin1: undefined }),
    makeCity({ id: 2, name: "Gatineau", country: undefined, admin1: undefined }),
  ];
  await showAllCitiesWeather(makeConfig({ cities }));
  expect(lines().filter((line) => line.includes(": 5.0 °C"))).toHaveLength(2);
});

test("showForecastFlow no consulta la API si no hay ciudades", async () => {
  const stub = forbidFetch();
  await showForecastFlow(fakeReader([]), makeConfig());
  expect(stub.requests).toHaveLength(0);
  expect(lines()[0]).toBe("  No hay ciudades guardadas. Usa la opción 3 para agregar una.");
});

test("showForecastFlow imprime los siete días", async () => {
  const stub = useJson(FORECAST_OK);
  const city = makeCity({ country: undefined, admin1: undefined });
  await showForecastFlow(fakeReader(["1"]), makeConfig({ cities: [city] }));
  expect(lines()).toContain("  Pronóstico 7 días — Ottawa");
  expect(lines().filter((line) => line.includes("Máx"))).toHaveLength(7);
  expect(lines().some((line) => line.includes("lun 23/11"))).toBe(true);
  expect(stub.requests[0]?.url.searchParams.get("forecast_days")).toBe("7");
});

test("showForecastFlow muestra el error de la API", async () => {
  useJson({ daily: {} });
  const city = makeCity({ country: undefined, admin1: undefined });
  await showForecastFlow(fakeReader(["1"]), makeConfig({ cities: [city] }));
  expect(lines().some((line) => line.includes("No pude obtener el pronóstico de Ottawa"))).toBe(
    true,
  );
});

test("listCities muestra el mensaje vacío o el listado numerado", () => {
  listCities(makeConfig());
  expect(lines()[0]).toBe("  No hay ciudades guardadas. Usa la opción 3 para agregar una.");

  logs.lines.length = 0;
  listCities(makeConfig({ cities: [makeCity(), makeCity({ id: 2, name: "Gatineau" })] }));
  expect(lines()).toEqual([
    "  Ciudades guardadas:",
    "  1. Ottawa, Ontario, Canadá",
    "  2. Gatineau, Ontario, Canadá",
  ]);
});
