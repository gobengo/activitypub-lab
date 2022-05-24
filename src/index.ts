import { main } from "./server.js";
import { fileURLToPath } from "url";
import process from "process";

export { ActivityPubUcanto } from "./activitypub/activitypub-ucanto";

export type {
  DID,
  Invocation,
  Result,
  ActivityPubUcantoAbstraction,
  InboxPostableActivity,
  InboxUcanto,
  InboxGetResponse,
  InboxGetUcanto,
  InboxGetUcantoHandler,
  InboxPostResponse,
  InboxPostUcanto,
  InboxPostUcantoHandler,
  OutboxPostableActivity,
  OutboxUcanto,
  OutboxGetResponse,
  OutboxGetUcanto,
  OutboxGetUcantoHandler,
  OutboxPostResponse,
  OutboxPostUcanto,
  OutboxPostUcantoHandler,
} from "./activitypub/activitypub-ucanto";

export type { AnnounceActivityPubCom } from "./activitypub/announcement.js";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    throw error;
  });
}
