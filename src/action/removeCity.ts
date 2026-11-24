import type { LineReader } from "../presentation/input";
import { chooseCity, showMessage } from "../presentation/salida";
import { removeCity } from "../Storage/CityStorage";
import { saveConfig } from "../Storage/settingsStorage";
import { green } from "../utils/colours";
import { cityLabel } from "../utils/format";
import type { Config } from "../tipos/Config";

export async function removeCityFlow(reader: LineReader, config: Config): Promise<Config> {
  const chosen = await chooseCity(reader, config);
  if (!chosen) return config;
  const next = removeCity(config, chosen.id);
  await saveConfig(next);
  showMessage(`  ${green(`Ciudad eliminada: ${cityLabel(chosen)}`)}`);
  return next;
}
