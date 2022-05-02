import * as Server from "ucanto/src/server.js";
import * as Transport from "ucanto/src/transport.js";
import { service } from "./service";

export const server = Server.create({
  service,
  decoder: Transport.CAR,
  encoder: Transport.CBOR,
});

/**
 * Run a server
 */
export function main() {
  console.log("server main");
}
