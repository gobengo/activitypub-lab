import * as DID from "@ipld/dag-ucan/src/did.js";
import * as ED25519 from "@noble/ed25519";
import * as API from "./api.js";
import { varint } from "multiformats";
import { UCAN } from "ucanto/src/api";
export const PUBLIC_TAG = 0xed as const;
export const PUBLIC_TAG_SIZE = varint.encodingLength(PUBLIC_TAG);

class Audience extends Uint8Array implements API.Audience {
  get algorithm() {
    return PUBLIC_TAG;
  }
  /** @readonly */
  get verificationKey() {
    const key = new Uint8Array(this.buffer, this.byteOffset + PUBLIC_TAG_SIZE);
    Object.defineProperties(this, {
      publicKey: {
        value: key,
      },
    });
    return key;
  }
  did() {
    return format(this);
  }
  verify<S extends API.Signer, T>(
    payload: API.ByteView<T>,
    signature: API.Signature<T, S>
  ): Promise<boolean> {
    return ED25519.verify(signature, payload, this.verificationKey);
  }
}

/**
 * Parses `did:key:` string as an Audience.
 */
export const parse = (did: UCAN.DID): API.Audience => decode(DID.parse(did));

export const decode = (bytes: Uint8Array): API.Audience => {
  const code = DID.algorithm(bytes);
  if (code === PUBLIC_TAG) {
    return new Audience(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  } else {
    throw new RangeError(
      `Unsupported key algorithm with multicode 0x${code.toString(16)}`
    );
  }
};

export const format = DID.format;
export const encode = DID.encode;
