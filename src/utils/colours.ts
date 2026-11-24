import { stdout } from "node:process";

const RESET = "\x1b[0m";

const CODES = {
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  red: "\x1b[31m",
} as const;

export type ColorName = keyof typeof CODES;

function colorsEnabled(): boolean {
  if (process.env.NO_COLOR) return false;
  const force = process.env.FORCE_COLOR;
  if (force !== undefined) return force !== "" && force !== "0";
  return stdout.isTTY === true;
}

export function paint(text: string, color: ColorName): string {
  if (text.length === 0 || !colorsEnabled()) return text;
  return `${CODES[color]}${text}${RESET}`;
}

export function cyan(text: string): string {
  return paint(text, "cyan");
}

export function yellow(text: string): string {
  return paint(text, "yellow");
}

export function green(text: string): string {
  return paint(text, "green");
}

export function red(text: string): string {
  return paint(text, "red");
}
