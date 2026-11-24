import { expect, test } from "bun:test";
import { chooseCity, printWeather, showError, showMessage } from "../../src/presentation/salida";
import {
  captureConsole,
  captureStdout,
  fakeReader,
  makeCity,
  makeConfig,
  stripAnsi,
  stubJson,
} from "../helpers";

test("showMessage y showError escriben en consola", () => {
  const console = captureConsole();
  try {
    showMessage("  mensaje");
    showError("falló");
    expect(console.lines.map(stripAnsi)).toEqual(["  mensaje", "  falló"]);
  } finally {
    console.restore();
  }
});

test("printWeather muestra la temperatura con la unidad elegida", async () => {
  const stub = stubJson({ current: { temperature_2m: 12.34, time: "2026-11-23T12:00" } });
  const console = captureConsole();
  try {
    await printWeather(
      makeCity({ country: undefined, admin1: undefined }),
      makeConfig({ unit: "fahrenheit" }),
    );
    expect(stripAnsi(console.lines[0] ?? "")).toBe("  Ottawa: 12.3 °F");
    expect(stub.requests[0]?.url.searchParams.get("temperature_unit")).toBe("fahrenheit");
  } finally {
    stub.restore();
    console.restore();
  }
});

test("printWeather muestra el error de la API sin lanzar", async () => {
  const stub = stubJson({ current: {} });
  const console = captureConsole();
  try {
    await printWeather(makeCity({ country: undefined, admin1: undefined }), makeConfig());
    expect(stripAnsi(console.lines[0] ?? "")).toBe(
      "  No pude obtener el clima de Ottawa: No recibí la temperatura de Ottawa.",
    );
  } finally {
    stub.restore();
    console.restore();
  }
});

test("chooseCity avisa si no hay ciudades guardadas", async () => {
  const console = captureConsole();
  const stdout = captureStdout();
  try {
    expect(await chooseCity(fakeReader([]), makeConfig())).toBeNull();
    expect(console.lines[0]).toBe(
      "  No hay ciudades guardadas. Usa la opción 3 para agregar una.",
    );
  } finally {
    stdout.restore();
    console.restore();
  }
});

test("chooseCity devuelve la ciudad seleccionada", async () => {
  const second = makeCity({ id: 2, name: "Gatineau", country: undefined, admin1: undefined });
  const config = makeConfig({ cities: [makeCity(), second] });
  const console = captureConsole();
  const stdout = captureStdout();
  try {
    expect(await chooseCity(fakeReader(["2"]), config)).toBe(second);
    expect(console.lines[0]).toBe("  Ciudades guardadas:");
    expect(stdout.written).toEqual(["  Elige una ciudad: "]);
  } finally {
    stdout.restore();
    console.restore();
  }
});

test("chooseCity rechaza índices no válidos", async () => {
  const config = makeConfig({ cities: [makeCity()] });
  const console = captureConsole();
  const stdout = captureStdout();
  try {
    expect(await chooseCity(fakeReader(["0"]), config)).toBeNull();
    expect(await chooseCity(fakeReader(["abc"]), config)).toBeNull();
    expect(await chooseCity(fakeReader(["9"]), config)).toBeNull();
    expect(console.lines.filter((line) => line.includes("Selección no válida."))).toHaveLength(3);
  } finally {
    stdout.restore();
    console.restore();
  }
});
