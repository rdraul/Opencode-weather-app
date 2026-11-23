import { afterEach, expect, test } from "bun:test";
import { geocode, getCurrentWeather, getSevenDayForecast } from "../src/openmeteo";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function stubJson(payload: unknown, onRequest?: (url: URL) => void): void {
  globalThis.fetch = (async (input: unknown) => {
    onRequest?.(new URL(String(input)));
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as unknown as typeof fetch;
}

test("geocode usa los parámetros del README y devuelve la ciudad", async () => {
  let requested: URL | undefined;
  stubJson(
    {
      results: [
        {
          id: 1,
          name: "Ottawa",
          latitude: 45.41117,
          longitude: -75.69812,
          country: "Canadá",
        },
      ],
    },
    (url) => {
      requested = url;
    },
  );

  const city = await geocode("Ottawa");
  expect(city.name).toBe("Ottawa");
  expect(requested?.searchParams.get("count")).toBe("1");
  expect(requested?.searchParams.get("language")).toBe("es");
  expect(requested?.searchParams.get("format")).toBe("json");
});

test("geocode avisa cuando no hay resultados", async () => {
  stubJson({ results: [] });
  await expect(geocode("CiudadInventada")).rejects.toThrow("No encontré la ciudad");
});

test("getCurrentWeather pide la unidad elegida y lee la temperatura", async () => {
  let requested: URL | undefined;
  stubJson(
    { current: { temperature_2m: 12.34, time: "2026-11-22T12:00" } },
    (url) => {
      requested = url;
    },
  );

  const weather = await getCurrentWeather(
    { id: 1, name: "Ottawa", latitude: 45.41117, longitude: -75.69812 },
    "fahrenheit",
  );
  expect(weather.temperature).toBe(12.34);
  expect(requested?.searchParams.get("temperature_unit")).toBe("fahrenheit");
  expect(requested?.searchParams.get("current")).toBe("temperature_2m");
});

test("getCurrentWeather falla si no viene temperatura", async () => {
  stubJson({ current: {} });
  await expect(
    getCurrentWeather({ id: 1, name: "Ottawa", latitude: 1, longitude: 2 }, "celsius"),
  ).rejects.toThrow("No recibí la temperatura");
});

const OTTAWA = { id: 1, name: "Ottawa", latitude: 45.41117, longitude: -75.69812 };

test("getSevenDayForecast pide 7 días diarios y devuelve cada día", async () => {
  let requested: URL | undefined;
  stubJson(
    {
      daily: {
        time: Array.from({ length: 7 }, (_, index) => `2026-11-${23 + index}`),
        temperature_2m_max: [10, 11, 12, 13, 14, 15, 16],
        temperature_2m_min: [2, 3, 4, 5, 6, 7, 8],
        weather_code: [0, 1, 2, 3, 61, 95, 0],
      },
    },
    (url) => {
      requested = url;
    },
  );

  const days = await getSevenDayForecast(OTTAWA, "fahrenheit");
  expect(days).toHaveLength(7);
  expect(days[0]).toEqual({ date: "2026-11-23", max: 10, min: 2, code: 0 });
  expect(days[6]).toEqual({ date: "2026-11-29", max: 16, min: 8, code: 0 });
  expect(requested?.searchParams.get("daily")).toBe(
    "temperature_2m_max,temperature_2m_min,weather_code",
  );
  expect(requested?.searchParams.get("forecast_days")).toBe("7");
  expect(requested?.searchParams.get("temperature_unit")).toBe("fahrenheit");
  expect(requested?.searchParams.get("timezone")).toBe("auto");
});

test("getSevenDayForecast falla si faltan días diarios", async () => {
  stubJson({ daily: { time: ["2026-11-23"] } });
  await expect(getSevenDayForecast(OTTAWA, "celsius")).rejects.toThrow(
    "No recibí el pronóstico",
  );
});

test("getSevenDayForecast falla si un valor diario no es válido", async () => {
  stubJson({
    daily: {
      time: Array.from({ length: 7 }, (_, index) => `2026-11-${23 + index}`),
      temperature_2m_max: [10, 11, 12, 13, 14, 15, "n/a"],
      temperature_2m_min: [2, 3, 4, 5, 6, 7, 8],
      weather_code: [0, 1, 2, 3, 61, 95, 0],
    },
  });
  await expect(getSevenDayForecast(OTTAWA, "celsius")).rejects.toThrow(
    "No recibí el pronóstico",
  );
});
