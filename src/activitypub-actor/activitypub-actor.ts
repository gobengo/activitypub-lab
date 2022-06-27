import {
  ActivityPubController,
  InboxController,
  OutboxController,
} from "../activitypub-http/controller.js";
import {
  InboxGetHandler,
  InboxPostHandler,
} from "../activitypub-inbox/inbox.js";
import {
  OutboxGetHandler,
  OutboxPostHandler,
} from "../activitypub-outbox/outbox.js";
import { KnownActivitypubActivity } from "../activitypub/activitypub.js";
import { ArrayRepository } from "../activitypub/repository-array.js";

export const createActivityPubActor = (
  console: Console
): ActivityPubController => {
  const repo = new ArrayRepository<KnownActivitypubActivity>();
  const authorizer = () => {
    console.warn("@todo: replace createActivityPub noop authorizer");
    return true;
  };
  const inbox: InboxController = {
    get: async (request) => {
      return new InboxGetHandler(repo, console).handle(request);
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
