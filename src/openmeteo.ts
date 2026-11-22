import { errorMessage } from "./errors";
import type { City, Unit } from "./types";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const TIMEOUT_MS = 10_000;

interface GeocodingResult {
  id?: unknown;
  name?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  country?: unknown;
  admin1?: unknown;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

interface ForecastResponse {
  current?: {
    temperature_2m?: unknown;
    time?: unknown;
  };
}

export interface CurrentWeather {
  temperature: number;
  time: string | null;
}

async function getJson<T>(url: URL): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    throw new Error(`No se pudo conectar con Open-Meteo: ${errorMessage(error)}`);
  }
  if (!response.ok) {
    throw new Error(`Open-Meteo respondió ${response.status} ${response.statusText}`.trim());
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error("Open-Meteo devolvió una respuesta JSON inválida.");
  }
}

export async function geocode(name: string): Promise<City> {
  const url = new URL(GEOCODING_URL);
  url.search = new URLSearchParams({
    name,
    count: "1",
    language: "es",
    format: "json",
  }).toString();

  const data = await getJson<GeocodingResponse>(url);
  const first = data.results?.[0];
  if (
    !first ||
    typeof first.id !== "number" ||
    !Number.isFinite(first.id) ||
    typeof first.name !== "string" ||
    first.name.length === 0 ||
    typeof first.latitude !== "number" ||
    !Number.isFinite(first.latitude) ||
    typeof first.longitude !== "number" ||
    !Number.isFinite(first.longitude)
  ) {
    throw new Error(`No encontré la ciudad "${name}".`);
  }

  return {
    id: first.id,
    name: first.name,
    latitude: first.latitude,
    longitude: first.longitude,
    country: typeof first.country === "string" ? first.country : undefined,
    admin1: typeof first.admin1 === "string" ? first.admin1 : undefined,
  };
}

export async function getCurrentWeather(city: City, unit: Unit): Promise<CurrentWeather> {
  const url = new URL(FORECAST_URL);
  url.search = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: "temperature_2m",
    temperature_unit: unit,
    timezone: "auto",
  }).toString();

  const data = await getJson<ForecastResponse>(url);
  const temperature = data.current?.temperature_2m;
  if (typeof temperature !== "number" || !Number.isFinite(temperature)) {
    throw new Error(`No recibí la temperatura de ${city.name}.`);
  }
  const time = data.current?.time;
  return { temperature, time: typeof time === "string" ? time : null };
}
