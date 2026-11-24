import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spyOn } from "bun:test";
import type { LineReader } from "../src/presentation/input";
import type { City } from "../src/tipos/City";
import type { Config } from "../src/tipos/Config";

export function makeCity(overrides: Partial<City> = {}): City {
  return {
    id: 1,
    name: "Ottawa",
    latitude: 45.41117,
    longitude: -75.69812,
    country: "Canadá",
    admin1: "Ontario",
    ...overrides,
  };
}

export function makeConfig(overrides: Partial<Config> = {}): Config {
  return { cities: [], defaultCityId: null, unit: "celsius", ...overrides };
}

export interface FakeLineReader extends LineReader {
  readonly read: string[];
}

export function fakeReader(lines: string[]): FakeLineReader {
  const queue = [...lines];
  const read: string[] = [];
  return {
    read,
    async next() {
      const line = queue.shift() ?? null;
      if (line !== null) read.push(line);
      return line;
    },
    close() {
      queue.length = 0;
    },
  };
}

export interface RecordedRequest {
  url: URL;
  init?: RequestInit;
}

export function stubFetch(
  handler: (request: RecordedRequest) => Response | Promise<Response>,
): { requests: RecordedRequest[]; restore: () => void } {
  const original = globalThis.fetch;
  const requests: RecordedRequest[] = [];
  globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
    const request: RecordedRequest = { url: new URL(String(input)), init };
    requests.push(request);
    return await handler(request);
  }) as unknown as typeof fetch;
  return {
    requests,
    restore() {
      globalThis.fetch = original;
    },
  };
}

export function stubJson(
  payload: unknown,
  status = 200,
  statusText = "",
  onRequest?: (request: RecordedRequest) => void,
): { requests: RecordedRequest[]; restore: () => void } {
  return stubFetch((request) => {
    onRequest?.(request);
    return new Response(JSON.stringify(payload), {
      status,
      statusText,
      headers: { "Content-Type": "application/json" },
    });
  });
}

export function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

function formatArgs(args: unknown[]): string {
  return args.map((arg) => String(arg)).join(" ");
}

export function captureConsole(): { lines: string[]; errors: string[]; restore: () => void } {
  const lines: string[] = [];
  const errors: string[] = [];
  const logSpy = spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    lines.push(formatArgs(args));
  });
  const errorSpy = spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    errors.push(formatArgs(args));
  });
  return {
    lines,
    errors,
    restore() {
      logSpy.mockRestore();
      errorSpy.mockRestore();
    },
  };
}

export function captureStdout(): { written: string[]; restore: () => void } {
  const written: string[] = [];
  const spy = spyOn(process.stdout, "write").mockImplementation(((chunk: unknown) => {
    written.push(String(chunk));
    return true;
  }) as typeof process.stdout.write);
  return {
    written,
    restore() {
      spy.mockRestore();
    },
  };
}

export async function tempConfigDir(): Promise<{
  dir: string;
  cleanup: () => Promise<void>;
}> {
  const dir = await mkdtemp(join(tmpdir(), "weather-cli-test-"));
  const original = process.env.WEATHER_CONFIG_DIR;
  process.env.WEATHER_CONFIG_DIR = dir;
  return {
    dir,
    cleanup: async () => {
      if (original === undefined) delete process.env.WEATHER_CONFIG_DIR;
      else process.env.WEATHER_CONFIG_DIR = original;
      await rm(dir, { recursive: true, force: true });
    },
  };
}
