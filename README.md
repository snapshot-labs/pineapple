# Pineapple

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
| Uploaded file exceed 1MB                                        | 400    | File too large                              |
| Uploaded image file is not an image                             | 415    | Unsupported file type                       |
| Uploaded payload does not contain a fileSize                    | 400    | No file submitted                           |
| Server error                                                    | 500    | (Will depend on the error)                  |                 |
