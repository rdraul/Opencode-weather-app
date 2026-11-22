import type { Unit } from "./types";

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
