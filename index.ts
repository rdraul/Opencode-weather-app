import { runCli } from "./src/index";
import { red } from "./src/utils/colours";
import { errorMessage } from "./src/utils/errors";

runCli().catch((error: unknown) => {
  console.error(`${red("Error fatal:")} ${errorMessage(error)}`);
  process.exitCode = 1;
});
