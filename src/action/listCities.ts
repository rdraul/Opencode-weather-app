import { showMessage } from "../presentation/salida";
import { cityLabel } from "../utils/format";
import type { Config } from "../tipos/Config";

export function listCities(config: Config): void {
  if (config.cities.length === 0) {
    showMessage("  No hay ciudades guardadas. Usa la opción 3 para agregar una.");
    return;
  }
  showMessage("  Ciudades guardadas:");
  config.cities.forEach((city, index) => {
    showMessage(`  ${index + 1}. ${cityLabel(city)}`);
  });
}
