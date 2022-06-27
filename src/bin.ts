#!/usr/bin/env node
import { fileURLToPath } from "url";
import { realpathSync } from "fs";
import process from "process";
import yargs, { CommandModule } from "yargs";
import { hideBin } from "yargs/helpers";

// https://github.com/multiformats/multicodec/blob/master/table.csv#L151
const ed25519PrivMulticodecCode = 0x1300;

if (realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    throw error;
  });
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .command(StartActivityPubHttpCommand())
    .help().argv;
}

function StartActivityPubHttpCommand(): CommandModule {
  return {
    command: "start-activitypub-http",
    describe: "start an http server implementing ActivityPub",
    handler: async () => {
      throw new Error("@todo implement start-http-server");
    },
  };
}
