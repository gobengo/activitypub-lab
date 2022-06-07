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
                    "totalItems": { "const": 0 },
                },
                "required": ["totalItems"],
            },
            {
                "type": "object",
                "properties": {
                    "name": { "const": "NotAuthorizedError" },
                    "status": { "const": 401 },
                },
                "required": ["name", "status"]
            }
        ]
    },
    "result": {
        name: "outbox",
    }
});
```

Log outbox

```javascript
await act({
    verb: "log",
    object: { name: "outbox" },
});
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
            "content": { "const": "invoke this capability to get the outbox" },
        },
        "required": ["content"]
    }
})
```

Log getCapability

```javascript
await act({
    "verb": "log",
    "object": {
        name: "getCapability"
    },
    "expectation": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "required": ["value"],
        "properties": {
            "value": {
                "type": "object",
                "required": ["content"],
                "properties": {
                    "content": { "const": "invoke this capability to get the outbox" },
                }
            }
        },
    }
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

Get the capability to post to the activitypub outbox. call it postOutboxCapability


```javascript
await act({
    "verb": "get",
    "object": "outbox/capabilities/post",
    "result": { "name": "postOutboxCapability" },
    "expectation": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
            "content": { "const": "invoke this capability to post messages to the outbox" },
        },
        "required": ["content"]
    }
})
await act({
    "verb": "log",
    "object": {
        name: "postOutboxCapability"
    },
})
```

Invoke postOutboxCapability to post to the outbox. call the response postOutboxResponse.

```javascript
await act({
    "verb": "post",
    "target": "outbox",
    "object": {
        "@context": "https://www.w3.org/ns/activitystreams",
        id: "foo",
        type: "Announce",
        actor: "activitypub.com"
    },
    "authorization": { "name": "postOutboxCapability" },
    "result": {
        "name": "postOutboxResponse"
    },
    "expectation": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
            "status": { "const": 201 },
        },
        "required": ["status"],
    }
})
await act({
    "verb": "log",
    "object": {
        name: "postOutboxResponse"
    },
})
```

Get the outbox again, expect `.totalItems` to be 1 now that we have posted one time.

```javascript
await act({
    "verb": "get",
    "object": "outbox",
    "result": { "name": "outbox" },
    "expectation": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
            "totalItems": { "const": 1 },
        },
        "required": ["totalItems"],
    }

})
await act({
    "verb": "log",
    "object": { "name": "outbox" },
})
```

```javascript
await act({
    "verb": "finish",
})
```