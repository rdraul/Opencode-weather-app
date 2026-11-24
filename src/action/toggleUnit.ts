import { saveConfig, toggleUnit } from "../Storage/settingsStorage";
import { showMessage } from "../presentation/salida";
import { green } from "../utils/colours";
import { unitLabel } from "../utils/format";
import type { Config } from "../tipos/Config";

export async function toggleUnitFlow(config: Config): Promise<Config> {
  const next = toggleUnit(config);
  await saveConfig(next);
  showMessage(`  ${green(`Unidad configurada: ${unitLabel(next.unit)}`)}`);
  return next;
}
