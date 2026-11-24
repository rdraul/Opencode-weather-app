import { FORECAST_DAYS, FORECAST_URL } from "../utils/constantes";
import { getJson } from "./client";
import type { City, Unit } from "../tipos/City";
import type { CurrentWeather, ForecastDay } from "../tipos/Weather";

interface DailyForecastResponse {
  time?: unknown[];
  temperature_2m_max?: unknown[];
  temperature_2m_min?: unknown[];
  weather_code?: unknown[];
}

interface ForecastResponse {
  current?: {
    temperature_2m?: unknown;
    time?: unknown;
  };
  daily?: DailyForecastResponse;
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

export async function getSevenDayForecast(city: City, unit: Unit): Promise<ForecastDay[]> {
  const url = new URL(FORECAST_URL);
  url.search = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    daily: "temperature_2m_max,temperature_2m_min,weather_code",
    forecast_days: String(FORECAST_DAYS),
    temperature_unit: unit,
    timezone: "auto",
  }).toString();

  const data = await getJson<ForecastResponse>(url);
  const daily = data.daily;
  const dates = daily?.time;
  const maximums = daily?.temperature_2m_max;
  const minimums = daily?.temperature_2m_min;
  const codes = daily?.weather_code;

  const invalid =
    !Array.isArray(dates) ||
    !Array.isArray(maximums) ||
    !Array.isArray(minimums) ||
    !Array.isArray(codes) ||
    dates.length < FORECAST_DAYS;
  if (invalid) {
    throw new Error(`No recibí el pronóstico de ${city.name}.`);
  }

  const days: ForecastDay[] = [];
  for (let index = 0; index < FORECAST_DAYS; index += 1) {
    const date = dates[index];
    const max = maximums[index];
    const min = minimums[index];
    const code = codes[index];
    if (
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      typeof max !== "number" ||
      !Number.isFinite(max) ||
      typeof min !== "number" ||
      !Number.isFinite(min) ||
      typeof code !== "number" ||
      !Number.isFinite(code)
    ) {
      throw new Error(`No recibí el pronóstico de ${city.name}.`);
    }
    days.push({ date, max, min, code });
  }
  return days;
}
