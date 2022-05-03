import { RequestListener } from "http";
import { ZERO_CID } from "./cid";
import { withHttpServer } from "./http";
import * as assert from "assert";
import { NewService } from "./service";
import * as Server from "ucanto/src/server.js";
import * as Transport from "ucanto/src/transport.js";
import * as Client from "ucanto/src/client.js";
import * as Issuer from "./actor/issuer.js";

export async function simpleDemo() {
  // create actors = {alice}
  const alice = await Issuer.generate();
  // create alice's initial content aliceCid1
  const aliceCid1 = ZERO_CID;
  // boot up the http gateway data plane
  const httpGateway = HttpGateway();
  // boot up control plane
  const connection = createNameServerDemoConnection();
  await withHttpServer(httpGateway, async (baseUrl) => {
    const index = new URL("/", baseUrl).toString();
    // fetch http gateway for aliceDid and expect http 404 response
    const resp1 = await fetch(index);
    assert.equal(resp1.status, 404);
    // alice publishes mapping aliceDid -> aliceCid1
    const alicePublish1 = Client.invoke({
      issuer: alice,
      audience: alice,
      capability: {
        can: "name/publish",
        with: alice.did(),
        content: aliceCid1,
      },
    });
    const alicePublish1Response = await alicePublish1.execute(connection);
    assert.ok(alicePublish1Response.ok);
    // alice resolves her aliceDid and expects aliceCid1
    const aliceResolve1 = Client.invoke({
      issuer: alice,
      audience: alice,
      capability: {
        can: "name/resolve",
        with: alice.did(),
      },
    });
    const aliceResolve1Response = await aliceResolve1.execute(connection);
    assert.ok(aliceResolve1Response.ok);
    assert.equal(aliceResolve1Response.value.content, aliceCid1);

    // alice fetches from http gateway and expects http response body of aliceCid1
  });
}

function createNameServerDemoConnection() {
  const server = Server.create({
    service: NewService(),
    decoder: Transport.CAR,
    encoder: Transport.CBOR,
  });
  const connection = Client.connect({
    encoder: Transport.CAR,
    decoder: Transport.CBOR,
    channel: server,
  });
  return connection;
}

export function writeDelegationDemo() {
  // create actors = {ben, yusef}
  // create ben's initial content benCid1
  // boot up the http gateway
  // fetch http gateway as benDid and expect http 404 response
  // fetch http gateway as yusefDid and expect http 404 response
  // ben publishes mapping benDid -> benCid1
  // ben resolves their benDid and expects benCid1
  // yusef resolves benDid and expects benCid1
  // yusef tries to publish benDid to nonceCid1, expecting PermissionError
  //
  // ben delegates publish cap to yusefDid1 for benDid1
  // yusef invokes publish with yusefCid1 for benDid1 and expects to succeed
  // ben resolves benDid1 and expects yusefCid1
  // potential followups: enxure expired delegation is not usable by yusef
}

function HttpGateway(): RequestListener {
  return (_req, _res) => {};
}
