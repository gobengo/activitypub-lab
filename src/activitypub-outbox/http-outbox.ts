import { RequestListener } from "http";

export interface UrlResolver {
  (baseUrl: URL): URL
}

export interface OutboxListener extends RequestListener {
  totalItems: number;
  urls: {
    index: UrlResolver
  }
}

export function OutboxListener(): OutboxListener {
  const listener: RequestListener = (_req, _res) => {
    _res.writeHead(200);
    _res.end(JSON.stringify("outbox"));
  };
  const properties: Omit<OutboxListener, '()'> = {
    totalItems: 0,
    urls: {
      index: (u: URL) => u,
    }
  }
  return Object.assign(listener, properties);
}
