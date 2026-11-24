import { expect, test } from "bun:test";
import { getJson } from "../../src/api/client";
import { stubFetch, stubJson } from "../helpers";

test("getJson envía Accept y devuelve el JSON", async () => {
  const stub = stubJson({ ok: true });
  try {
    const result = await getJson<{ ok: boolean }>(new URL("https://api.example.com/datos"));
    expect(result).toEqual({ ok: true });
    expect(stub.requests[0]?.url.toString()).toBe("https://api.example.com/datos");
    const headers = stub.requests[0]?.init?.headers as Record<string, string> | undefined;
    expect(headers?.Accept).toBe("application/json");
    expect(stub.requests[0]?.init?.signal).toBeDefined();
  } finally {
    stub.restore();
  }
});

test("getJson convierte errores de red en un mensaje claro", async () => {
  const stub = stubFetch(() => {
    throw new Error("sin conexión");
  });
  try {
    await expect(getJson(new URL("https://api.example.com/datos"))).rejects.toThrow(
      "No se pudo conectar con Open-Meteo: sin conexión",
    );
  } finally {
    stub.restore();
  }
});

test("getJson informa el estado HTTP cuando la respuesta no es OK", async () => {
  const stub = stubJson({}, 503, "Service Unavailable");
  try {
    await expect(getJson(new URL("https://api.example.com/datos"))).rejects.toThrow(
      "Open-Meteo respondió 503 Service Unavailable",
    );
  } finally {
    stub.restore();
  }
});

test("getJson rechaza un JSON inválido", async () => {
  const stub = stubFetch(() => new Response("esto no es json", { status: 200 }));
  try {
    await expect(getJson(new URL("https://api.example.com/datos"))).rejects.toThrow(
      "Open-Meteo devolvió una respuesta JSON inválida.",
    );
  } finally {
    stub.restore();
  }
});
