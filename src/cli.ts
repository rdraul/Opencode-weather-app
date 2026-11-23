import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline";
import { cyan, green, red, yellow } from "./color";
import { errorMessage } from "./errors";
import { cityLabel, formatForecastDay, formatTemperature, unitLabel } from "./format";
import { geocode, getCurrentWeather, getSevenDayForecast } from "./openmeteo";
import { addCity, loadConfig, removeCity, saveConfig, setDefaultCity, toggleUnit } from "./store";
import type { City, Config } from "./types";

const LINE = "════════════════════════════════════════";

class EndOfInput extends Error {}

interface LineReader {
  next(): Promise<string | null>;
  close(): void;
}

function createLineReader(): LineReader {
  const rl = createInterface({ input: stdin, terminal: false });
  const queue: string[] = [];
  let waiting: ((line: string | null) => void) | null = null;
  let closed = false;

  rl.on("line", (line) => {
    if (waiting) {
      const resolve = waiting;
      waiting = null;
      resolve(line);
    } else {
      queue.push(line);
    }
  });
  rl.on("close", () => {
    closed = true;
    if (waiting) {
      const resolve = waiting;
      waiting = null;
      resolve(null);
    }
  });

  return {
    next() {
      if (queue.length > 0) return Promise.resolve(queue.shift() ?? null);
      if (closed) return Promise.resolve(null);
      return new Promise((resolve) => {
        waiting = resolve;
      });
    },
    close() {
      rl.close();
    },
  };
}

function renderMenu(config: Config): string {
  const menu = [
    LINE,
    "         WEATHER CLI",
    LINE,
    "  1. Clima de ciudad default",
    `  2. Clima de todas las ciudades (${config.cities.length})`,
    "  3. Buscar y agregar ciudad",
    "  4. Eliminar ciudad",
    "  5. Establecer ciudad default",
    "  6. Pronóstico 7 días",
    `  8. Ajustes (${unitLabel(config.unit)})`,
    "  9. Salir",
    LINE,
  ].join("\n");
  return cyan(menu);
}

async function ask(reader: LineReader, message: string): Promise<string> {
  stdout.write(message);
  const line = await reader.next();
  if (line === null) throw new EndOfInput();
  return line.trim();
}

async function chooseCity(reader: LineReader, config: Config): Promise<City | null> {
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

async function printWeather(city: City, config: Config): Promise<void> {
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

async function showDefault(config: Config): Promise<void> {
  const city = config.cities.find((saved) => saved.id === config.defaultCityId);
  if (!city) {
    console.log("  Aún no hay ciudad default. Usa la opción 3 para agregar o la 5 para elegir.");
    return;
  }
  await printWeather(city, config);
}

async function showAll(config: Config): Promise<void> {
  if (config.cities.length === 0) {
    console.log("  No hay ciudades guardadas. Usa la opción 3 para agregar una.");
    return;
  }
  for (const city of config.cities) {
    await printWeather(city, config);
  }
}

async function showForecastFlow(reader: LineReader, config: Config): Promise<void> {
  const chosen = await chooseCity(reader, config);
  if (!chosen) return;
  try {
    const days = await getSevenDayForecast(chosen, config.unit);
    console.log(`  Pronóstico 7 días — ${cityLabel(chosen)}`);
    for (const day of days) {
      console.log(`  ${formatForecastDay(day, config.unit)}`);
    }
  } catch (error) {
    console.log(
      `  ${red(`No pude obtener el pronóstico de ${chosen.name}: ${errorMessage(error)}`)}`,
    );
  }
}

async function addCityFlow(reader: LineReader, config: Config): Promise<Config> {
  const name = await ask(reader, "  Nombre de la ciudad: ");
  if (name.length === 0) return config;

  try {
    const city = await geocode(name);
    const next = addCity(config, city);
    if (next === config) {
      console.log(`  ${cityLabel(city)} ya estaba guardada.`);
      return config;
    }
    await saveConfig(next);
    console.log(`  ${green(`Ciudad agregada: ${cityLabel(city)}`)}`);
    return next;
  } catch (error) {
    console.log(`  ${red(errorMessage(error))}`);
    return config;
  }
}

async function removeCityFlow(reader: LineReader, config: Config): Promise<Config> {
  const chosen = await chooseCity(reader, config);
  if (!chosen) return config;
  const next = removeCity(config, chosen.id);
  await saveConfig(next);
  console.log(`  ${green(`Ciudad eliminada: ${cityLabel(chosen)}`)}`);
  return next;
}

async function setDefaultFlow(reader: LineReader, config: Config): Promise<Config> {
  const chosen = await chooseCity(reader, config);
  if (!chosen) return config;
  const next = setDefaultCity(config, chosen.id);
  await saveConfig(next);
  console.log(`  ${green(`Ciudad default: ${cityLabel(chosen)}`)}`);
  return next;
}

async function toggleUnitFlow(config: Config): Promise<Config> {
  const next = toggleUnit(config);
  await saveConfig(next);
  console.log(`  ${green(`Unidad configurada: ${unitLabel(next.unit)}`)}`);
  return next;
}

export async function runCli(): Promise<void> {
  let config = await loadConfig();
  const reader = createLineReader();
  try {
    for (;;) {
      console.log(`\n${renderMenu(config)}`);
      const option = await ask(reader, "  Selecciona una opción: ");
      switch (option) {
        case "1":
          await showDefault(config);
          break;
        case "2":
          await showAll(config);
          break;
        case "3":
          config = await addCityFlow(reader, config);
          break;
        case "4":
          config = await removeCityFlow(reader, config);
          break;
        case "5":
          config = await setDefaultFlow(reader, config);
          break;
        case "6":
          await showForecastFlow(reader, config);
          break;
        case "8":
          config = await toggleUnitFlow(config);
          break;
        case "9":
          console.log("  ¡Hasta luego!");
          return;
        default:
          console.log(`  ${red("Opción no válida.")}`);
      }
    }
  } catch (error) {
    if (!(error instanceof EndOfInput)) throw error;
    console.log("\n  ¡Hasta luego!");
  } finally {
    reader.close();
  }
}
