import { main } from "./server.js";
import { fileURLToPath } from "url";
import process from "process";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
