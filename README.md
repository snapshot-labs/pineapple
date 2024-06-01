# Pineapple

Use [pineapple.js](https://github.com/snapshot-labs/pineapple.js) to interact with this service.

## Error codes

All endpoints will respond with a [JSON-RPC 2.0](https://www.jsonrpc.org/specification) error response on error:

```bash
{
  "jsonrpc":"2.0",
  "error":{
    "code": CODE,
    "message": MESSAGE
  },
  "id": ID
}
```

| Description                                                     | `CODE` | `MESSAGE`                                   |
| --------------------------------------------------------------- | ------ | ------------------------------------------- |
| Uploaded image file exceed 1MB                                  | 400    | File too large                              |
| Uploaded json file exceed 100kb                                 | 400    | File too large                              |
| Uploaded image file is not an image                             | 415    | Unsupported file type                       |
| Uploaded payload does not contain a `fileSize`                  | 400    | No file submitted                           |
| Server error                                                    | 500    | (Will depend on the error)                  |                 |
