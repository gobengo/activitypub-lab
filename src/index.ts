import { fileURLToPath } from "url";
import process from "process";

const main = async () => {
  /** @todo make it run an activitypub server */
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    throw error;
  });
}

/**
 * @module activitypub-ucanto
 * ActivityPub implemented using ucanto
 */

/** ActivityPub protocol */
export * as activitypub from "./activitypub/activitypub.js";

/** ActivityPub implementation using ucanto */
export * as ActivityPubUcanto from "./activitypub-ucanto/activitypub-ucanto.js";
