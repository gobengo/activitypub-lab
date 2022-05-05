# ucanto-name-service

A networked service that maintains a mapping of [DID](https://www.w3.org/TR/did-core/)s to [CID](https://github.com/multiformats/cid)s.

Controllers of a DID can invoke the `name/publish` capability to change the CID corresponding to their DID.

Controllers can also delegate the `name/publish` capability using [UCAN](https://github.com/ucan-wg/spec)s so that other people can publish on their behalf.

Anyone can resolve the CID for a DID using the `name/resolve` capability.

## Usage

There is a hosted instance [on glitch](https://glitch.com/edit/#!/cypress-fluttering-koala) accessible at:
* http-name-resolver: https://cypress-fluttering-koala.glitch.me
* ucanto HTTP transport control plane: https://cypress-fluttering-koala.glitch.me/control

```bash
secret="$(npx --yes @web3-storage/ucanto-name-system request-secret)"
echo "secret=$secret"

did="$(npx --yes @web3-storage/ucanto-name-system whoami $secret)"
echo "did=$did"

glitch_data_uri="https://cypress-fluttering-koala.glitch.me"
glitch_control_uri="$glitch_data_uri/control"

echo "resolving before publish, expecting 404 response"
curl "$glitch_data_uri/$did" -i

echo "publishing new cid"
npx --yes @web3-storage/ucanto-name-system publish --uri="$glitch_control_uri" --secret="$secret" --cid="bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy"

echo "resolving after publish"
curl "$glitch_data_uri/$did" -i | grep location

echo "opening in browser"; sleep 2;
open "$glitch_data_uri/$did"
```

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
