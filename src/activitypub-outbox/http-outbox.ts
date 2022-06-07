import { RequestListener } from "http";
import Koa from "koa";
import { Parser, Route, URL, route, router, Response } from "typera-koa";
import * as t from "io-ts";
import bodyParser from "koa-bodyparser";
import {
  OutboxPost,
  OutboxPostHandler,
  OutboxRepository,
  OutboxItem,
  OutboxGetHandler,
  OutboxGet,
} from "./outbox.js";
import { ArrayRepository } from "../activitypub/repository-array.js";
import type { AnnounceActivityPubCom } from "../activitypub/announcement";

const activities: OutboxRepository = new ArrayRepository<OutboxItem>();

const outboxGetRoute: Route<
  Response.Response<
    OutboxGet["Response"]["status"],
    OutboxGet["Response"],
    undefined
  >
> = route
  .get("/") // Capture id from the path
  .handler(async (request) => {
    const handler = new OutboxGetHandler(activities);
    const response = await handler.handle(request);
    return {
      status: response.status,
      body: response,
      headers: undefined,
    };
  });

export const announceActivityPubActivityType = t.type({
  "@context": t.literal("https://www.w3.org/ns/activitystreams"),
  id: t.string,
  type: t.literal("Announce"),
  actor: t.literal("activitypub.com"),
});

const outboxPostRoute: Route<
  | Response.BadRequest<string, undefined>
  | Response.Created<OutboxPost["Response"], { location: string }>
> = route
  .post("/") // Capture id from the path
  .use(Parser.body(announceActivityPubActivityType))
  .handler(async (request) => {
    const handler = new OutboxPostHandler(activities);
    const reqBody: AnnounceActivityPubCom = request.body;
    const response = await handler.handle(reqBody);
    const location = `?id=${reqBody.id}`;
    return Response.created(response, { location });
  });

export interface UrlResolver {
  (baseUrl: URL): URL;
}

export interface OutboxListener extends RequestListener {
  totalItems: number;
  urls: {
    index: UrlResolver;
  };
}

function OutboxKoa(): Koa {
  const app = new Koa();
  app.use(bodyParser());
  app.use(router(outboxGetRoute, outboxPostRoute).handler());
  return app;
}

export function OutboxListener(): OutboxListener {
  const koa = OutboxKoa();
  const listener: RequestListener = koa.callback();
  const properties: Omit<OutboxListener, "()"> = {
    totalItems: 0,
    urls: {
      index: (u: URL) => u,
    },
  };
  return Object.assign(listener, properties);
}
