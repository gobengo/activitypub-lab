import {
  ActivityPubController,
  InboxController,
  OutboxController,
} from "../activitypub-http/controller.js";
import { InboxPostHandler } from "../activitypub-inbox/inbox.js";
import {
  OutboxGetHandler,
  OutboxPostHandler,
} from "../activitypub-outbox/outbox.js";
import { AnnounceActivityPubCom } from "./announcement.js";
import { ArrayRepository } from "./repository-array.js";

/** ActivityPub inbox */
export * as inbox from "../activitypub-inbox/inbox.js";

/** ActivityPub outbox */
export * as outbox from "../activitypub-outbox/outbox.js";

/** Generic request/response */
export * as handler from "./handler.js";

/** repositories for storing data */
export * as repo from "./repository-array.js";

/** activitypub announcements - e.g. new actors */
export * as announcement from "./announcement.js";

export type KnownActivitypubActivity = AnnounceActivityPubCom;

export const createActivityPub = (console: Console): ActivityPubController => {
  const repo = new ArrayRepository<KnownActivitypubActivity>();
  const authorizer = () => {
    console.warn("@todo: replace createActivityPub noop authorizer");
    return true;
  };
  const inbox: InboxController = {
    get: async () => {
      return {
        totalItems: await repo.count(),
      };
    },
    post: async (request) => {
      return new InboxPostHandler(repo, console).handle(request);
    },
  };
  const outbox: OutboxController = {
    get: async (request) => {
      return new OutboxGetHandler(repo, authorizer).handle(request);
    },
    post: async (request) => {
      console.debug("activitypub.outbox.post", request);
      return new OutboxPostHandler(repo).handle(request);
    },
  };
  return { inbox, outbox };
};
