#!/usr/bin/env node
import { fileURLToPath } from "url";
import { realpathSync } from "fs";
import process from "process";
import yargs, { CommandModule } from "yargs";
import { hideBin } from "yargs/helpers";

if (realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    throw error;
  });
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .command(RequestUcanCommand())
    .help().argv;
}

function RequestUcanCommand(): CommandModule {
  return {
    command: "request-ucan",
    describe: "request a UCAN to invoke the name service",
    handler: async () => {
      console.log("RequestUcanCommand");
    },
  };
}
