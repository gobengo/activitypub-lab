import * as nodeHttp from "http";
import type { AddressInfo } from "net";

export async function withHttpServer(
  listener: nodeHttp.RequestListener,
  useServer: (baseUrl: URL) => Promise<void> | void
) {
  const httpServer = nodeHttp.createServer(listener);
  await new Promise((resolve, _reject) => {
    httpServer.listen(0, () => {
      resolve(true);
    });
  });
  const baseUrl = addressUrl(httpServer.address());
  if (!baseUrl) {
    throw new Error(`failed to determine baseUrl from ucantoServer`);
  }
  try {
    await useServer(baseUrl);
  } finally {
    await new Promise((resolve, _reject) => {
      httpServer.close(resolve);
    });
  }
  return;
}

export function addressUrl(addressInfo: string | AddressInfo | null): URL {
  if (addressInfo === null)
    throw new TypeError("addressInfo is unexpectedly null");
  if (typeof addressInfo === "string") return new URL(addressInfo);
  const { address, port } = addressInfo;
  const host = address === "::" ? "127.0.0.1" : address;
  const urlString = `http://${host}:${port}`;
  return new URL(urlString);
}
