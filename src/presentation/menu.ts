import { LINE } from "../utils/constantes";
import { cyan } from "../utils/colours";
import { unitLabel } from "../utils/format";
import type { Config } from "../tipos/Config";
import type { MenuOption } from "../tipos/MenuOption";

export function getMenuOptions(config: Config): MenuOption[] {
  return [
    { key: "1", label: "Clima de ciudad default" },
    { key: "2", label: `Clima de todas las ciudades (${config.cities.length})` },
    { key: "3", label: "Buscar y agregar ciudad" },
    { key: "4", label: "Eliminar ciudad" },
    { key: "5", label: "Establecer ciudad default" },
    { key: "6", label: "Pronóstico 7 días" },
    { key: "8", label: `Ajustes (${unitLabel(config.unit)})` },
    { key: "9", label: "Salir" },
  ];
}

export function renderMenu(config: Config): string {
  const options = getMenuOptions(config)
    .map((option) => `  ${option.key}. ${option.label}`)
    .join("\n");
  const menu = [LINE, "         WEATHER CLI", LINE, options, LINE].join("\n");
  return cyan(menu);
}
