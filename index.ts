import { runCli } from "./src/cli";
import { red } from "./src/color";
import { errorMessage } from "./src/errors";

runCli().catch((error: unknown) => {
  console.error(`${red("Error fatal:")} ${errorMessage(error)}`);
  process.exitCode = 1;
});
