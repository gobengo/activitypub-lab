import {
  InboxGetRequest,
  InboxGetResponse,
  InboxPostRequest,
  InboxPostResponse,
} from "../activitypub-inbox/inbox";
import { OutboxGet, OutboxPost } from "../activitypub-outbox/outbox.js";
import { ServiceMethodFunction } from "../activitypub/handler";

/** inbox */

export interface InboxGet {
  (request: InboxGetRequest): Promise<InboxGetResponse>;
}

export interface InboxPost {
  (request: InboxPostRequest): Promise<InboxPostResponse>;
}

export interface InboxController {
  get: InboxGet;
  post: InboxPost;
}

/** outbox */

export interface OutboxController {
  get: ServiceMethodFunction<OutboxGet>;
  post: ServiceMethodFunction<OutboxPost>;
}

/** activitypub */

export interface ActivityPubController {
  inbox: InboxController;
  outbox: OutboxController;
}
