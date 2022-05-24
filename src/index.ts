import { main } from "./server.js";
import { fileURLToPath } from "url";
import process from "process";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    throw error;
  });
}

/** ActivityPub implementation using ucanto */
export * as ActivityPubUcanto from "./activitypub/activitypub-ucanto";

/** activitypub announcements - e.g. new actors */
export * as announcement from "./activitypub/announcement";

/** Generic request/response */
export * as handler from "./activitypub/handler";

/** ActivityPub inbox */
export * as inbox from "./activitypub/inbox";

/** ActivityPub outbox */
export * as outbox from "./activitypub/outbox";

/** repositories for storing data */
export * as repo from "./activitypub/repository-array";
