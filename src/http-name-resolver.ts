import { DID } from "@ipld/dag-ucan/src/ucan";
import { IncomingMessage, RequestListener, ServerResponse } from "http";
import {
  default as express,
  Express,
  Request,
  RequestHandler,
  Router,
} from "express";
import * as Client from "ucanto/src/client.js";
import {
  NewService,
  IClientConnection,
  IServiceAPI as INameServiceAPI,
} from "./service";
import * as Issuer from "./actor/issuer.js";
import * as Transport from "ucanto/src/transport.js";
import * as Server from "ucanto/src/server.js";

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
    res.writeHead(200);
    res.end(
      JSON.stringify({
        did,
        cid: resolution.value.content,
      })
    );
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
          mssage: error.message,
        })
      );
    });
  };
}
