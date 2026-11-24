import type { City, Unit } from "./City";

export interface Config {
  cities: City[];
  defaultCityId: number | null;
  unit: Unit;
}
