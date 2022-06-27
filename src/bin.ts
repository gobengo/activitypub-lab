#!/usr/bin/env node
import { fileURLToPath } from "url";
import { realpathSync } from "fs";
import process from "process";
import yargs, { CommandModule } from "yargs";
import { hideBin } from "yargs/helpers";
import {
  generate as generateIssuer,
  derive as deriveIssuer,
} from "./ucanto-actor/issuer.js";
import { CID } from "multiformats";
import { identity } from "multiformats/hashes/identity";
import * as Hasher from "multiformats/hashes/hasher";
import * as assert from "assert";
import * as Client from "ucanto/src/client.js";
import * as Transport from "ucanto/src/transport.js";
import * as HTTP from "ucanto/src/transport/http.js";
import { IServiceAPI } from "./service.js";
import { universalFetch } from "./fetch.js";

// https://github.com/multiformats/multicodec/blob/master/table.csv#L151
const ed25519PrivMulticodecCode = 0x1300;

if (realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    throw error;
  });
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .command(RequestKeysCommand())
    .command(WhoamiCommand())
    .command(PublishCommand())
    .help().argv;
}

function RequestKeysCommand(): CommandModule {
  return {
    command: "request-secret",
    describe:
      "request a new (ed25519) ksecretey to use to invoke the name service. Serialized as a CID.",
    handler: async () => {
      const ephemeralIssuer = await generateIssuer();
      const secret = ephemeralIssuer.secret;
      const secretCid = await createEd25519PrivateKeyCid(secret);
      console.log(secretCid.toString());
    },
  };
}

function WhoamiCommand(): CommandModule {
  return {
    command: "whoami [secret]",
    describe:
      "given a secret, return the corresponding public identifier (DID)",
    builder: (yargs) => {
      return yargs
        .positional("secret", {
          alias: "secret",
          describe: "secret you wish to publicly identify",
          type: "string",
        })
        .demandOption("secret", "secret is required in order to answer whoami");
    },
    handler: async (argv) => {
      const { secret } = argv;
      const issuer = await deriveIssuer(
        parseEd25519PrivKeyCid(String(secret)).multihash.digest
      );
      const issuerDid = issuer.did();
      console.log(issuerDid);
    },
  };
}

function PublishCommand(): CommandModule {
  return {
    command: "publish",
    describe: "publish a new CID that can be resolved by DID",
    builder: (yargs) => {
      return yargs
        .option("secret", {
          describe: "secret used to build the publish invocation",
          type: "string",
        })
        .option("cid", {
          describe:
            "CID indicating content that should be the result of resolving this DID",
          type: "string",
        })
        .option("uri", {
          describe: "uri to ucanto-name-system control plane",
          type: "string",
        })
        .demandOption("secret", "secret is required in order to invoke publish")
        .demandOption("cid", "cid is required to publish")
        .demandOption("uri", "uri is required to invoke publish");
    },
    handler: async (argv) => {
      const { secret: secretString, cid: cidString, uri } = argv;
      if (typeof uri !== "string") {
        throw new TypeError("expected uri to be a string");
      }
      if (typeof cidString !== "string") {
        throw new TypeError("expected cid to be a string");
      }
      const cid = CID.parse(cidString);
      const issuer = await deriveIssuer(
        parseEd25519PrivKeyCid(String(secretString)).multihash.digest
      );
      const connection = Client.connect({
        encoder: Transport.CAR, // encode as CAR because server decodes from car
        decoder: Transport.CBOR, // decode as CBOR because server encodes as CBOR
        /** @type {Transport.Channel<typeof service>} */
        channel: HTTP.open<IServiceAPI>({
          fetch: universalFetch,
          url: new URL(uri),
        }), // simple `fetch` wrapper
      });
      const publish = Client.invoke({
        issuer,
        // @todo this should be another parameter or discovered via http introspection
        audience: issuer,
        capability: {
          can: "name/publish",
          // @todo fix types
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          with: issuer.audience.did() as any as `${string}:${string}`,
          content: cid,
          origin: null,
        },
      });
      const publishResponse = await publish.execute(connection);
      assert.ok(publishResponse.ok);
      console.log(publishResponse);
    },
  };
}

function parseEd25519PrivKeyCid(cidString: string): CID {
  const cid = CID.parse(String(cidString));
  assert.equal(cid.code, ed25519PrivMulticodecCode);
  assert.equal(cid.multihash.code, 0);
  assert.equal(cid.multihash.digest.length, 32);
  return cid;
}

async function createEd25519PrivateKeyCid(secretKey: Uint8Array): Promise<CID> {
  return CID.createV1(
    ed25519PrivMulticodecCode,
    await Hasher.from(identity).digest(secretKey)
  );
}
