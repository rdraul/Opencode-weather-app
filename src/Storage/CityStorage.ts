import type { City } from "../tipos/City";
import type { Config } from "../tipos/Config";

export function addCity(config: Config, city: City): Config {
  if (config.cities.some((saved) => saved.id === city.id)) return config;
  return { ...config, cities: [...config.cities, city] };
}

export function removeCity(config: Config, id: number): Config {
  return {
    ...config,
    cities: config.cities.filter((city) => city.id !== id),
    defaultCityId: config.defaultCityId === id ? null : config.defaultCityId,
  };
}

export function setDefaultCity(config: Config, id: number): Config {
  if (!config.cities.some((city) => city.id === id)) return config;
  return { ...config, defaultCityId: id };
}

export function getDefaultCity(config: Config): City | undefined {
  return config.cities.find((city) => city.id === config.defaultCityId);
}
