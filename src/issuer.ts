import { KeyPair } from "ucan-storage/keypair";
import { Client } from "ucanto/src/lib";

export function createIssuer(keypair: KeyPair): Client.Issuer<number> {
  return Object.assign(keypair, {
    algorithm: 0xed as const,
  }) as Client.Issuer<number>;
}
