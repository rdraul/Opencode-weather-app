import { geocode } from "../api/geocoding";
import { ask, type LineReader } from "../presentation/input";
import { showError, showMessage } from "../presentation/salida";
import { addCity } from "../Storage/CityStorage";
import { saveConfig } from "../Storage/settingsStorage";
import { green } from "../utils/colours";
import { errorMessage } from "../utils/errors";
import { cityLabel } from "../utils/format";
import type { Config } from "../tipos/Config";

export async function addCityFlow(reader: LineReader, config: Config): Promise<Config> {
  const name = await ask(reader, "  Nombre de la ciudad: ");
  if (name.length === 0) return config;

  try {
    const city = await geocode(name);
    const next = addCity(config, city);
    if (next === config) {
      showMessage(`  ${cityLabel(city)} ya estaba guardada.`);
      return config;
    }
    await saveConfig(next);
    showMessage(`  ${green(`Ciudad agregada: ${cityLabel(city)}`)}`);
    return next;
  } catch (error) {
    showError(errorMessage(error));
    return config;
  }
}
