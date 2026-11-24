import { GEOCODING_URL } from "../utils/constantes";
import { getJson } from "./client";
import type { City } from "../tipos/City";

interface GeocodingResult {
  id?: unknown;
  name?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  country?: unknown;
  admin1?: unknown;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

export async function geocode(name: string): Promise<City> {
  const url = new URL(GEOCODING_URL);
  url.search = new URLSearchParams({
    name,
    count: "1",
    language: "es",
    format: "json",
  }).toString();

  const data = await getJson<GeocodingResponse>(url);
  const first = data.results?.[0];
  if (
    !first ||
    typeof first.id !== "number" ||
    !Number.isFinite(first.id) ||
    typeof first.name !== "string" ||
    first.name.length === 0 ||
    typeof first.latitude !== "number" ||
    !Number.isFinite(first.latitude) ||
    typeof first.longitude !== "number" ||
    !Number.isFinite(first.longitude)
  ) {
    throw new Error(`No encontré la ciudad "${name}".`);
  }

  return {
    id: first.id,
    name: first.name,
    latitude: first.latitude,
    longitude: first.longitude,
    country: typeof first.country === "string" ? first.country : undefined,
    admin1: typeof first.admin1 === "string" ? first.admin1 : undefined,
  };
}
