# ucanto-name-service

A networked service that maintains a mapping of [DID](https://www.w3.org/TR/did-core/)s to [CID](https://github.com/multiformats/cid)s.

Controllers of a DID can invoke the `name/publish` capability to change the CID corresponding to their DID.

Controllers can also delegate the `name/publish` capability using [UCAN](https://github.com/ucan-wg/spec)s so that other people can publish on their behalf.

Anyone can resolve the CID for a DID using the `name/resolve` capability.

## Interface

```js
interface Publish {
  can: "name/publish"
  with: DID
  content: Link<any>
  origin: null|Link<Publish>
}

interface Resolve {
  can: "name/resolve",
  with: DID
}

interface NameService {
  publish(request: Invocation<Publish>): Promise<
    Result<
      Link<Publish>>,
      PermissionError | OriginError
    >
  >
  resolve(request: Invocation<Resolve>): Promise<
    Result<
      Publish,
      PermissionError | NotFoundError
    >
  >
}
```
