# Typescript module

### Interface

```js
interface Publish {
  can: "name/publish"
  with: DID
  content: Link<any>
  origin?: Link<Publish>
}

interface Resolve {
  can: "name/resolve",
  with: DID
}


interface NameService {
  publish(request:Invocation<Publish>):Promise<Result<Link<Publish>>, PermissionError|OriginError>>
  resolve(request:Invocation<Resolve>):Promise<Result<Publish, PermissionError>>
}
```
