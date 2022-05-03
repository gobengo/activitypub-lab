import * as assert from "assert"
import { describe, it } from "mocha"

import * as Issuer from "./issuer.js"
import * as Audence from "./audience.js"
import { sha256 } from "multiformats/hashes/sha2"
import { TextEncoder } from "util"

describe("issuer / audience", () => {
  it("can generate issuer", async () => {
    const issuer = await Issuer.generate()
    assert.equal(issuer.algorithm, 0xed)
    assert.ok(issuer.did().startsWith("did:key"))
    assert.equal(issuer.did(), issuer.audience.did())
    assert.ok(issuer instanceof Uint8Array)

    const payload = await sha256.encode(new TextEncoder().encode("hello world"))
    const signature = await issuer.sign(payload)
    assert.ok(
      await issuer.verify(payload, signature),
      "audience can verify signature"
    )
    assert.ok(
      await issuer.audience.verify(payload, signature),
      "issuer can verify signature"
    )
  })

  it("can derive issuer from secert", async () => {
    const original = await Issuer.generate()
    const derived = await Issuer.derive(original.secret)

    assert.deepEqual(original.secret, derived.secret)
    assert.equal(original.algorithm, derived.algorithm)
    assert.equal(original.did(), derived.did())
  })

  it("can parse audience from did", async () => {
    const issuer = await Issuer.generate()
    assert.deepEqual(Audence.parse(issuer.did()), issuer.audience)
  })
})
