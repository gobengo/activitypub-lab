import {
  InboxGetRequest,
  InboxGetResponse,
  InboxPostRequest,
  InboxPostResponse,
} from "../activitypub-inbox/inbox";
import { InboxHttpController } from "./controller-http.js";

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

export interface ActivityPubController {
  inbox: InboxController;
}
