import * as UCAN from "@ipld/dag-ucan";

export const code = 0xed;
export interface Issuer extends UCAN.Issuer<typeof code>, Audience {
  audience: Audience;
  secret: Uint8Array;
}
export interface Verifier extends UCAN.Verifier<typeof code> {}
export interface Signer extends UCAN.Signer<typeof code> {}
export type { ByteView } from "@ipld/dag-ucan";
export interface Signature<T = unknown, S extends Signer = Signer>
  extends UCAN.Phantom<T>,
    Uint8Array {
  signer?: S;
}

export interface Audience extends UCAN.Agent, Verifier {}
