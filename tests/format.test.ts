import { expect, test } from "bun:test";
import { formatForecastDay, weatherCodeLabel, weekdayLabel } from "../src/format";
import type { ForecastDay } from "../src/openmeteo";

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
