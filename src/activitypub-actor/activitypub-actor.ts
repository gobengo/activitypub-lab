import { Activity } from "../activity/activity.js";
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
  console: Console,
  inboxRepository = new ArrayRepository<Activity>(),
  outboxRepository = new ArrayRepository<Activity>()
): ActivityPubController => {
  const authorizer = () => {
    console.warn("@todo: replace createActivityPub noop authorizer");
    return true;
  };
  const inbox: InboxController = {
    get: async (request) => {
      return new InboxGetHandler(inboxRepository, console).handle(request);
    },
    post: async (request) => {
      return new InboxPostHandler(inboxRepository, console).handle(request);
    },
  };
  const outbox: OutboxController = {
    get: async (request) => {
      return new OutboxGetHandler(outboxRepository, authorizer).handle(request);
    },
    post: async (request) => {
      console.debug("activitypub.outbox.post", request);
      return new OutboxPostHandler(outboxRepository).handle(request);
    },
  };
  return { inbox, outbox };
};
