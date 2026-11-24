import { getCurrentWeather } from "../api/weather";
import { red, yellow } from "../utils/colours";
import { errorMessage } from "../utils/errors";
import { cityLabel, formatTemperature } from "../utils/format";
import { ask, type LineReader } from "./input";
import type { City } from "../tipos/City";
import type { Config } from "../tipos/Config";

export function showMessage(message: string): void {
  console.log(message);
}

export function showError(message: string): void {
  console.log(`  ${red(message)}`);
}

export async function printWeather(city: City, config: Config): Promise<void> {
  try {
    const weather = await getCurrentWeather(city, config.unit);
    console.log(
      `  ${cityLabel(city)}: ${yellow(formatTemperature(weather.temperature, config.unit))}`,
    );
  } catch (error) {
    console.log(
      `  ${red(`No pude obtener el clima de ${city.name}: ${errorMessage(error)}`)}`,
    );
  }
}

export async function chooseCity(reader: LineReader, config: Config): Promise<City | null> {
  if (config.cities.length === 0) {
    console.log("  No hay ciudades guardadas. Usa la opción 3 para agregar una.");
    return null;
  }
  console.log("  Ciudades guardadas:");
  config.cities.forEach((city, index) => {
    console.log(`  ${index + 1}. ${cityLabel(city)}`);
  });

  const index = Number(await ask(reader, "  Elige una ciudad: ")) - 1;
  const chosen = config.cities[index];
  if (!Number.isInteger(index) || index < 0 || !chosen) {
    console.log(`  ${red("Selección no válida.")}`);
    return null;
  }
  return chosen;
}
