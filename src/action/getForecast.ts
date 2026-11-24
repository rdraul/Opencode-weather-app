import { getSevenDayForecast } from "../api/weather";
import type { LineReader } from "../presentation/input";
import { chooseCity, showMessage } from "../presentation/salida";
import { errorMessage } from "../utils/errors";
import { cityLabel, formatForecastDay } from "../utils/format";
import { red } from "../utils/colours";
import type { Config } from "../tipos/Config";

export async function showForecastFlow(reader: LineReader, config: Config): Promise<void> {
  const chosen = await chooseCity(reader, config);
  if (!chosen) return;
  try {
    const days = await getSevenDayForecast(chosen, config.unit);
    showMessage(`  Pronóstico 7 días — ${cityLabel(chosen)}`);
    for (const day of days) {
      showMessage(`  ${formatForecastDay(day, config.unit)}`);
    }
  } catch (error) {
    showMessage(
      `  ${red(`No pude obtener el pronóstico de ${chosen.name}: ${errorMessage(error)}`)}`,
    );
  }
}
