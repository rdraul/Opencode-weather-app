import { afterEach, expect, test } from "bun:test";
import { geocode, getCurrentWeather } from "../src/openmeteo";

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
