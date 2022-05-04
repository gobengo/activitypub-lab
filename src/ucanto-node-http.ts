import * as Client from "ucanto/src/client.js";
import * as nodeHttp from "http";
import all from "it-all";
import * as uint8arrays from "uint8arrays";

export function ucantoHttpRequestListener<T>(
  ucantoServer: Client.ServerView<T>
) {
  const listener: nodeHttp.RequestListener = (req, res) => {
    all(req)
      .then(async (httpRequestBodyChunks) => {
        const httpRequestBodyArrayBuffer = uint8arrays.concat(
          httpRequestBodyChunks
        );
        let ucantoResponse;
        const headers = toHeadersRecord(req.headers);
        try {
          ucantoResponse = await ucantoServer.request({
            body: httpRequestBodyArrayBuffer,
            headers,
          });
        } catch (error) {
          console.warn("ucantoServer error", error);
          res.writeHead(500);
          res.end(
            JSON.stringify({
              message: error instanceof Error ? error.message : undefined,
            })
          );
          return;
        }
        res.writeHead(200, ucantoResponse?.headers);
        res.end(ucantoResponse?.body);
      })
      .catch((error) => {
        res.writeHead(500);
        res.end(
          JSON.stringify({
            type: "Unexpected Error",
            message: error.message,
          })
        );
      });
  };
  return listener;
}

function toHeadersRecord(
  headers: nodeHttp.IncomingHttpHeaders
): Readonly<Record<string, string>> {
  const headersRecord: Record<string, string> = {};
  for (const [key, valueOrValues] of Object.entries(headers)) {
    const value = Array.isArray(valueOrValues)
      ? valueOrValues[0]
      : valueOrValues;
    if (typeof value !== "string") {
      console.warn("got unexpected non-string header value. ignoring", value);
      continue;
    }
    headersRecord[key] = value;
  }
  return headersRecord;
}
