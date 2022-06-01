# activitypub-capabilities

authorization capabilities for activitypub

## Example

```javascript
import { actor } from "./capabilities.js";
export default {};

const { act } = actor();
```

Try to get collection. Expect NotAuthorizedError

```javascript
await act({
    "verb": "get",
    "object": "outbox",
    "expectation": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "oneOf": [
            {
                "type": "object",
                "properties": {
                    "totalItems": { "type": "number" },
                },
                "required": ["totalItems"],
            },
            {
                "type": "object",
                "properties": {
                    "name": { "const": "NotFoundError" },
                    "status": { "const": 401 },
                },
                "required": ["name", "status"]
            }
        ]
    },
})
```

Get capability to get collection. call it getCapability

```javascript
await act({
    "verb": "get",
    "object": "outbox/capabilities/get",
    "result": {
        "name": "getCapability"
    },
    "expectation": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
            "content": { "const": "invoke this capability to post a message to the outbox" },
        },
        "required": ["content"]
    }
})
```

Log getCapability

```
await act({
    "verb": "log",
    "object": {
        name: "getCapability"
    },
})
```

Invoke getCapability to get outbox. call it outbox

```javascript
await act({
    "verb": "get",
    "object": "outbox",
    "authorization": { "name": "getCapability" },
    "id": "urn:uuid:02c26a1d-b25e-4cce-9bbe-9617bc22fbf5",
    "prev": "urn:uuid:6e9d2a4b-ac1d-4fb9-a059-efcec9343dbe",
    "result": { "name": "outbox" },
    "expectation": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
            "totalItems": { "const": 0 },
        },
        "required": ["totalItems"],
    }
})
```

Get the capability to post to the activitypub inbox. call it postInboxCapability


```
{
    "verb": "get",
    "object": "?capability=inboxPost",
    "result": { "name": "postInboxCapability" },
}
```

Invoke postInboxCapability to post to the inbox. call the response postInboxResponse.

```
{
    "verb": "post",
    "object": "",
    "authorization": { "name": "postInboxCapability" },
    "result": {
        "name": "postInboxResponse"
    }
}
```

```javascript
await act({
    "verb": "finish",
})
```