import { getDefaultCity } from "../Storage/CityStorage";
import { printWeather, showMessage } from "../presentation/salida";
import type { Config } from "../tipos/Config";

export async function showDefaultWeather(config: Config): Promise<void> {
  const city = getDefaultCity(config);
  if (!city) {
    showMessage(
      "  Aún no hay ciudad default. Usa la opción 3 para agregar o la 5 para elegir.",
    );
    return;
  }
  await printWeather(city, config);
}

export async function showAllCitiesWeather(config: Config): Promise<void> {
  if (config.cities.length === 0) {
    showMessage("  No hay ciudades guardadas. Usa la opción 3 para agregar una.");
    return;
  }
  for (const city of config.cities) {
    await printWeather(city, config);
  }
}
