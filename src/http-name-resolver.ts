import { DID } from "@ipld/dag-ucan/src/ucan";
import { IncomingMessage, RequestListener, ServerResponse } from "http";
import {
  default as express,
  Express,
  Request,
  RequestHandler,
  Router,
} from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import * as Client from "ucanto/src/client.js";
import { IServiceAPI as INameServiceAPI } from "./service";
import * as Issuer from "./actor/issuer.js";
import * as Transport from "ucanto/src/transport.js";
import * as Server from "ucanto/src/server.js";

const GATEWAY_HOST = "https://nftstorage.link";

/**
 * HTTP RequestListener that does `name/resolve` over HTTP.
 * Used to demo/test the name service as a sample 'data plane'.
 */
export async function HttpNameResolver(
  nameService: INameServiceAPI
): Promise<RequestListener> {
  const router = Router();
  router.get("/", getIndex);
  router.get(/\/(did:[^/]+)/, await GetDidResolution(nameService));
  const app = express().use(router);

  const proxyLogLevel = process.env.NODE_ENV === "test" ? "warn" : "debug";
  app.use(
    "/ipfs",
    createProxyMiddleware({
      target: GATEWAY_HOST,
      changeOrigin: true,
      logLevel: proxyLogLevel,
    })
  );
  return app;
}

export const HttpNameResolverUrls = {
  index(baseUrl: URL) {
    return new URL("/", baseUrl);
  },
  resolve(baseUrl: URL, did: DID) {
    return new URL(`/${did}`, baseUrl);
  },
};

function getIndex(_req: IncomingMessage, res: ServerResponse) {
  res.writeHead(200);
  res.end(
    JSON.stringify({
      message: "Welcome to HttpNameResolver",
    })
  );
}

async function GetDidResolution(nameService: INameServiceAPI) {
  const httpServerIssuer = await Issuer.generate();
  return AsyncRequestListener(async function (
    req: Request<[DID]>,
    res: ServerResponse
  ) {
    const did = req.params[0];
    const resolveDid = Client.invoke({
      issuer: httpServerIssuer,
      audience: nameService,
      capability: {
        can: "name/resolve",
        with: did,
      },
    });
    const server = Server.create({
      service: nameService,
      decoder: Transport.CAR,
      encoder: Transport.CBOR,
    });
    const connection = Client.connect({
      encoder: Transport.CAR,
      decoder: Transport.CBOR,
      channel: server,
    });
    const resolution = await resolveDid.execute(connection);
    if (!resolution.ok) {
      switch (resolution.name) {
        case "NotFoundError": {
          res.writeHead(404);
          res.end();
          return;
        }
        default:
          const _x: never = resolution.name;
          throw new Error("Unexpected resolution error");
      }
    }

    const cid = resolution.value.content;

    if (req.headers.accept === "application/json") {
      res.writeHead(200);
      res.end(
        JSON.stringify({
          did,
          cid,
        })
      );
      return;
    }

    // redirect to /ipfs/cid, which will proxy to IPFS gateway
    res.writeHead(302, {
      Location: `/ipfs/${cid}`,
    });
    res.end();
  });
}

function AsyncRequestListener<P>(
  asyncFn: (req: Request<P>, res: ServerResponse) => Promise<void>
): RequestHandler<P> {
  return (req, res): void => {
    asyncFn(req, res).catch((error) => {
      console.warn("AsyncRequestListener error", error);
      res.writeHead(500);
      res.end(
        JSON.stringify({
          type: "UnexpectedError",
          message: error.message,
        })
      );
    });
  };
}
