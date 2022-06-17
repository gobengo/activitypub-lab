import assert from "assert";
import {
  InboxGetRequest,
  InboxPostRequest,
} from "../activitypub-inbox/inbox.js";
import { OutboxGet, OutboxPost } from "../activitypub-outbox/outbox.js";
import { universalFetch } from "../fetch.js";
import { hasOwnProperty } from "../object.js";
import {
  ActivityPubController,
  InboxController,
  OutboxController,
} from "./controller.js";

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

/**
 * Control an ActivityPub Inbox over HTTP
 */
export class OutboxHttpController implements OutboxController {
  constructor(
    /** url of activitypub inbox */
    private url: URL,
    /** method to make http requests with */
    private fetch = universalFetch
  ) {}
  get = async (_req: OutboxGet["Request"]) => {
    const resp = await this.fetch(this.url.toString(), {
      headers: {
        authorization: String(_req.authorization),
      },
    });
    const inbox = await resp.json();
    return inbox;
  };
  post = async (
    _req: OutboxPost["Request"]
  ): Promise<OutboxPost["Response"]> => {
    const resp = await this.fetch(this.url.toString(), {
      method: "post",
      body: JSON.stringify(_req, null, 2),
    });
    const body = (await resp.json()) as unknown;
    assert.ok(typeof body === "object");
    assert.ok(body);
    assert.ok(hasOwnProperty(body, "posted"));
    assert.ok(body.posted === true);
    assert.ok(hasOwnProperty(body, "status"));
    assert.ok(body.status === 201);
    return {
      ...body,
      status: body.status,
      posted: body.posted,
    };
  };
}

export class HttpActivityPubController implements ActivityPubController {
  constructor(
    baseUrl: URL,
    inboxUrl: URL = new URL("/inbox", baseUrl),
    public inbox = new InboxHttpController(inboxUrl),
    outboxUrl = new URL("/outbox", baseUrl),
    public outbox = new OutboxHttpController(outboxUrl)
  ) {}
}
