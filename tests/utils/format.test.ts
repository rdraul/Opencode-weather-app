import { expect, test } from "bun:test";
import {
  cityLabel,
  formatForecastDay,
  formatTemperature,
  unitLabel,
  weatherCodeLabel,
  weekdayLabel,
} from "../../src/utils/format";
import type { ForecastDay } from "../../src/tipos/Weather";
import { stripAnsi } from "../helpers";

test("weekdayLabel convierte la fecha ISO a día en español", () => {
  expect(weekdayLabel("2026-11-23")).toBe("lun");
  expect(weekdayLabel("2026-11-22")).toBe("dom");
});

test("weatherCodeLabel mapea códigos WMO y desconocidos", () => {
  expect(weatherCodeLabel(0)).toBe("Despejado");
  expect(weatherCodeLabel(2)).toBe("Parcialmente nublado");
  expect(weatherCodeLabel(95)).toBe("Tormenta eléctrica");
  expect(weatherCodeLabel(999)).toBe("Clima desconocido");
});

test("formatForecastDay muestra día, fecha, temperaturas y clima", () => {
  const day: ForecastDay = { date: "2026-11-23", max: 8.25, min: -1.3, code: 2 };
  const line = formatForecastDay(day, "celsius").replace(/\x1b\[[0-9;]*m/g, "");
  expect(line).toContain("lun 23/11");
  expect(line).toContain("Máx 8.3 °C");
  expect(line).toContain("Mín -1.3 °C");
  expect(line).toContain("Parcialmente nublado");
});

test("unitLabel y formatTemperature respetan la unidad", () => {
  expect(unitLabel("celsius")).toBe("°C");
  expect(unitLabel("fahrenheit")).toBe("°F");
  expect(formatTemperature(8.25, "celsius")).toBe("8.3 °C");
  expect(formatTemperature(-1.3, "fahrenheit")).toBe("-1.3 °F");
});

test("cityLabel une los campos disponibles", () => {
  expect(cityLabel({ name: "Ottawa" })).toBe("Ottawa");
  expect(cityLabel({ name: "Ottawa", admin1: "Ontario" })).toBe("Ottawa, Ontario");
  expect(cityLabel({ name: "Ottawa", country: "Canadá" })).toBe("Ottawa, Canadá");
  expect(cityLabel({ name: "Ottawa", admin1: "Ontario", country: "Canadá" })).toBe(
    "Ottawa, Ontario, Canadá",
  );
});

test("formatForecastDay funciona en Fahrenheit", () => {
  const day: ForecastDay = { date: "2026-11-23", max: 50, min: 30, code: 0 };
  const line = stripAnsi(formatForecastDay(day, "fahrenheit"));
  expect(line).toContain("Máx 50.0 °F");
  expect(line).toContain("Mín 30.0 °F");
  expect(line).toContain("Despejado");
});

test("weekdayLabel y weatherCodeLabel manejan entradas desconocidas", () => {
  expect(weekdayLabel("")).toBe("");
  expect(weatherCodeLabel(-1)).toBe("Clima desconocido");
  expect(weatherCodeLabel(99)).toBe("Tormenta con granizo intenso");
});
