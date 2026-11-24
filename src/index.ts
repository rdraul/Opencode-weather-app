import { addCityFlow } from "./action/addCity";
import { showForecastFlow } from "./action/getForecast";
import { showAllCitiesWeather, showDefaultWeather } from "./action/getWeather";
import { removeCityFlow } from "./action/removeCity";
import { setDefaultCityFlow } from "./action/setDefaultCity";
import { toggleUnitFlow } from "./action/toggleUnit";
import { ask, createLineReader, EndOfInput } from "./presentation/input";
import { renderMenu } from "./presentation/menu";
import { showMessage } from "./presentation/salida";
import { loadConfig } from "./Storage/settingsStorage";
import { red } from "./utils/colours";

export async function runCli(): Promise<void> {
  let config = await loadConfig();
  const reader = createLineReader();
  try {
    for (;;) {
      console.log(`\n${renderMenu(config)}`);
      const option = await ask(reader, "  Selecciona una opción: ");
      switch (option) {
        case "1":
          await showDefaultWeather(config);
          break;
        case "2":
          await showAllCitiesWeather(config);
          break;
        case "3":
          config = await addCityFlow(reader, config);
          break;
        case "4":
          config = await removeCityFlow(reader, config);
          break;
        case "5":
          config = await setDefaultCityFlow(reader, config);
          break;
        case "6":
          await showForecastFlow(reader, config);
          break;
        case "8":
          config = await toggleUnitFlow(config);
          break;
        case "9":
          showMessage("  ¡Hasta luego!");
          return;
        default:
          showMessage(`  ${red("Opción no válida.")}`);
      }
    }
  } catch (error) {
    if (!(error instanceof EndOfInput)) throw error;
    console.log("\n  ¡Hasta luego!");
  } finally {
    reader.close();
  }
}
