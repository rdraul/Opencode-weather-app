import { REQUEST_TIMEOUT_MS } from "../utils/constantes";
import { errorMessage } from "../utils/errors";

export async function getJson<T>(url: URL): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    throw new Error(`No se pudo conectar con Open-Meteo: ${errorMessage(error)}`);
  }
  if (!response.ok) {
    throw new Error(`Open-Meteo respondió ${response.status} ${response.statusText}`.trim());
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error("Open-Meteo devolvió una respuesta JSON inválida.");
  }
}
