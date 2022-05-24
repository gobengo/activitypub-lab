import { main } from "./server.js";
import { fileURLToPath } from "url";
import process from "process";

export * as activitypub from "./activitypub/activitypub.js";
export * as announcement from "./activitypub/announcement.js";
export * from "./activitypub/activitypub-ucanto";
export { ArrayRepository } from "./activitypub/repository-array";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    throw error;
  });
}
