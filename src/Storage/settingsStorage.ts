import { mkdir, rename } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { CONFIG_DIR_NAME, CONFIG_FILE } from "../utils/constantes";
import { errorMessage } from "../utils/errors";
import type { City } from "../tipos/City";
import type { Config } from "../tipos/Config";

function configDir(): string {
  return process.env.WEATHER_CONFIG_DIR ?? join(homedir(), CONFIG_DIR_NAME);
}

function configPath(): string {
  return join(configDir(), CONFIG_FILE);
}

export function defaultConfig(): Config {
  return { cities: [], defaultCityId: null, unit: "celsius" };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCity(value: unknown): value is City {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "number" &&
    Number.isFinite(value.id) &&
    typeof value.name === "string" &&
    value.name.length > 0 &&
    typeof value.latitude === "number" &&
    Number.isFinite(value.latitude) &&
    typeof value.longitude === "number" &&
    Number.isFinite(value.longitude) &&
    (value.country === undefined || typeof value.country === "string") &&
    (value.admin1 === undefined || typeof value.admin1 === "string")
  );
}

function parseConfig(value: unknown): Config {
  if (!isRecord(value) || !Array.isArray(value.cities)) {
    throw new Error("La configuración guardada no es válida.");
  }
  const cities = value.cities.filter(isCity);
  const storedDefault = value.defaultCityId;
  const defaultCityId =
    typeof storedDefault === "number" && cities.some((city) => city.id === storedDefault)
      ? storedDefault
      : null;
  const unit = value.unit === "fahrenheit" ? "fahrenheit" : "celsius";
  return { cities, defaultCityId, unit };
}

export async function loadConfig(): Promise<Config> {
  const file = Bun.file(configPath());
  if (!(await file.exists())) return defaultConfig();

  let raw: string;
  try {
    raw = await file.text();
  } catch (error) {
    throw new Error(`No se pudo leer la configuración: ${errorMessage(error)}`);
  }
  try {
    return parseConfig(JSON.parse(raw) as unknown);
  } catch (error) {
    throw new Error(`No se pudo interpretar la configuración: ${errorMessage(error)}`);
  }
}

export async function saveConfig(config: Config): Promise<void> {
  const dir = configDir();
  const temp = join(dir, `.config-${process.pid}.tmp`);
  await mkdir(dir, { recursive: true });
  await Bun.write(temp, `${JSON.stringify(config, null, 2)}\n`);
  await rename(temp, join(dir, CONFIG_FILE));
}

export function toggleUnit(config: Config): Config {
  return { ...config, unit: config.unit === "celsius" ? "fahrenheit" : "celsius" };
}
