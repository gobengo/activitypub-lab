import * as ED25519 from "@noble/ed25519"
import { varint } from "multiformats"
import * as UCAN from "@ipld/dag-ucan"
import * as API from "./api.js"
import { PUBLIC_TAG, PUBLIC_TAG_SIZE } from "./audience.js"
import * as Audience from "./audience.js"

const PRIVATE_TAG = 0x1300 as const
const PRIVATE_TAG_SIZE = varint.encodingLength(PRIVATE_TAG)
const KEY_SIZE = 32

/**
 * Generates new issuer by generating underlying ED25519 keypair.
 */
export const generate = () => derive(ED25519.utils.randomPrivateKey())

/**
 * Derives issuer from 32 byte long secret key.
 */
export const derive = async (secret: Uint8Array): Promise<API.Issuer> => {
  if (secret.byteLength !== KEY_SIZE) {
    throw new Error(
      `Expected secret with byteLength of 32 instead not ${secret.byteLength}`
    )
  }

  const publicKey = await ED25519.getPublicKey(secret)
  const size = PRIVATE_TAG_SIZE + KEY_SIZE + PUBLIC_TAG_SIZE + KEY_SIZE
  const bytes = new Uint8Array(size)

  varint.encodeTo(PRIVATE_TAG, bytes, 0)
  bytes.set(secret, PRIVATE_TAG_SIZE)

  varint.encodeTo(PUBLIC_TAG, bytes, PRIVATE_TAG_SIZE + KEY_SIZE)
  bytes.set(publicKey, PRIVATE_TAG_SIZE + KEY_SIZE + PUBLIC_TAG_SIZE)

  return new Issuer(bytes.buffer)
}

class Issuer extends Uint8Array implements API.Issuer, API.Audience {
  get algorithm() {
    return PUBLIC_TAG
  }

  get audience() {
    const bytes = new Uint8Array(this.buffer, PRIVATE_TAG_SIZE + KEY_SIZE)
    const audience = Audience.decode(bytes)
    Object.defineProperties(this, {
      audience: {
        value: audience,
      },
    })
    return audience
  }

  get secret() {
    const secret = new Uint8Array(this.buffer, PRIVATE_TAG_SIZE, KEY_SIZE)
    Object.defineProperties(this, {
      secret: {
        value: secret,
      },
    })

    return secret
  }

  /** @readonly */
  get verificationKey() {
    const key = new Uint8Array(
      this.buffer,
      PRIVATE_TAG_SIZE + KEY_SIZE + PUBLIC_TAG_SIZE
    )
    Object.defineProperties(this, {
      publicKey: {
        value: key,
      },
    })
    return key
  }
  did() {
    return this.audience.did()
  }

  sign<T>(payload: UCAN.ByteView<T>) {
    return ED25519.sign(payload, this.secret)
  }

  verify<T>(payload: UCAN.ByteView<T>, signature: Uint8Array) {
    return ED25519.verify(signature, payload, this.verificationKey)
  }
}
