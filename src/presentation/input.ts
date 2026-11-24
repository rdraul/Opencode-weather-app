import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline";

export class EndOfInput extends Error {}

export interface LineReader {
  next(): Promise<string | null>;
  close(): void;
}

export function createLineReader(): LineReader {
  const rl = createInterface({ input: stdin, terminal: false });
  const queue: string[] = [];
  let waiting: ((line: string | null) => void) | null = null;
  let closed = false;

  rl.on("line", (line) => {
    if (waiting) {
      const resolve = waiting;
      waiting = null;
      resolve(line);
    } else {
      queue.push(line);
    }
  });
  rl.on("close", () => {
    closed = true;
    if (waiting) {
      const resolve = waiting;
      waiting = null;
      resolve(null);
    }
  });

  return {
    next() {
      if (queue.length > 0) return Promise.resolve(queue.shift() ?? null);
      if (closed) return Promise.resolve(null);
      return new Promise((resolve) => {
        waiting = resolve;
      });
    },
    close() {
      rl.close();
    },
  };
}

export async function ask(reader: LineReader, message: string): Promise<string> {
  stdout.write(message);
  const line = await reader.next();
  if (line === null) throw new EndOfInput();
  return line.trim();
}
