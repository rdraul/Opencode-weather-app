import { yellow } from "./colours";
import type { Unit } from "../tipos/City";
import type { ForecastDay } from "../tipos/Weather";

const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"] as const;

const WEATHER_CODES: Record<number, string> = {
  0: "Despejado",
  1: "Principalmente despejado",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Niebla",
  48: "Niebla con escarcha",
  51: "Llovizna débil",
  53: "Llovizna",
  55: "Llovizna intensa",
  56: "Llovizna congelante débil",
  57: "Llovizna congelante intensa",
  61: "Lluvia débil",
  63: "Lluvia",
  65: "Lluvia intensa",
  66: "Lluvia congelante débil",
  67: "Lluvia congelante intensa",
  71: "Nieve débil",
  73: "Nieve",
  75: "Nieve intensa",
  77: "Granos de nieve",
  80: "Chubascos débiles",
  81: "Chubascos",
  82: "Chubascos intensos",
  85: "Chubascos de nieve débiles",
  86: "Chubascos de nieve intensos",
  95: "Tormenta eléctrica",
  96: "Tormenta con granizo débil",
  99: "Tormenta con granizo intenso",
};

export function unitLabel(unit: Unit): string {
  return unit === "celsius" ? "°C" : "°F";
}

export function cityLabel(city: {
  name: string;
  admin1?: string;
  country?: string;
}): string {
  return [city.name, city.admin1, city.country].filter(Boolean).join(", ");
}

export function formatTemperature(temperature: number, unit: Unit): string {
  return `${temperature.toFixed(1)} ${unitLabel(unit)}`;
}

export function weekdayLabel(date: string): string {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return "";
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  return WEEKDAYS[parsed.getDay()] ?? "";
}

export function weatherCodeLabel(code: number): string {
  return WEATHER_CODES[code] ?? "Clima desconocido";
}

export function formatForecastDay(day: ForecastDay, unit: Unit): string {
  const [, month, dayOfMonth] = day.date.split("-");
  const shortDate = month && dayOfMonth ? `${dayOfMonth}/${month}` : day.date;
  const max = yellow(formatTemperature(day.max, unit));
  const min = yellow(formatTemperature(day.min, unit));
  return `${weekdayLabel(day.date)} ${shortDate} · Máx ${max} · Mín ${min} · ${weatherCodeLabel(day.code)}`;
}
