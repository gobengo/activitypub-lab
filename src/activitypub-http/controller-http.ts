import {
  InboxGetRequest,
  InboxPostRequest,
} from "../activitypub-inbox/inbox.js";
import { universalFetch } from "../fetch.js";
import { ActivityPubController, InboxController } from "./controller.js";

/**
 * Control an ActivityPub Inbox over HTTP
 */
export class InboxHttpController implements InboxController {
  constructor(
    /** url of activitypub inbox */
    private url: URL,
    /** method to make http requests with */
    private fetch = universalFetch
  ) {}
  get = async (_req: InboxGetRequest) => {
    const resp = await this.fetch(this.url.toString());
    const inbox = await resp.json();
    return inbox;
  };
  post = async (_req: InboxPostRequest) => {
    const resp = await this.fetch(this.url.toString(), {
      method: "post",
      body: JSON.stringify(_req, null, 2),
    });
    const body = await resp.json();
    return body;
  };
}

export class HttpActivityPubController implements ActivityPubController {
  constructor(
    baseUrl: URL,
    inboxUrl: URL = new URL("/inbox", baseUrl),
    public inbox = new InboxHttpController(inboxUrl)
  ) {}
}
