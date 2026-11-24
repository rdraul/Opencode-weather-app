import { createLineReader } from "../../src/presentation/input";

const reader = createLineReader();
const lines: string[] = [];
try {
  for (;;) {
    const line = await reader.next();
    if (line === null) break;
    lines.push(line);
  }
} finally {
  reader.close();
}
console.log(JSON.stringify(lines));
