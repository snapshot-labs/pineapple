import { S3 } from '@aws-sdk/client-s3';
import { sha256 } from '../../utils';

const { EVER_API_KEY, EVER_API_SECRET } = process.env;

export const provider = '4everland';
const client = new S3({
  endpoint: 'https://endpoint.4everland.co',
  region: 'eu-west-2',
  credentials: {
    accessKeyId: EVER_API_KEY || '',
    secretAccessKey: EVER_API_SECRET || ''
  }
});

function extractBody(body: unknown): string | undefined {
  if (typeof body === 'string') return body;
  if (Buffer.isBuffer(body)) return body.toString('utf-8');
  if (body instanceof Uint8Array) return Buffer.from(body).toString('utf-8');
  return undefined;
}

// 4everland is S3-compatible but not real S3, so error responses are not
// always valid XML. When the AWS SDK fails to deserialize an error body it
// throws a generic "Cannot read properties of undefined (reading '#text')"
// that hides the actual upstream status/body. Surface them here.
async function withResponseDetails<T>(
  op: string,
  run: () => Promise<T>
): Promise<T> {
  try {
    return await run();
  } catch (err: any) {
    const status = err?.$response?.statusCode ?? err?.$metadata?.httpStatusCode;
    const rawBody = extractBody(err?.$response?.body);
    const parts = [
      status && `status=${status}`,
      rawBody && `body=${rawBody.slice(0, 500)}`
    ].filter(Boolean);
    const fallback = err instanceof Error ? err.message : String(err);
    const detail = parts.length ? parts.join(' ') : fallback;
    throw new Error(`${provider} ${op} failed${detail ? `: ${detail}` : ''}`, {
      cause: err
    });
  }
}

export async function set(data: Buffer | object) {
  const payload = data instanceof Buffer ? data : JSON.stringify(data);
  const params = {
    Bucket: process.env.EVER_BUCKET_NAME,
    Key: sha256(payload)
  };
  await withResponseDetails('putObject', () =>
    client.putObject({
      ...params,
      Body: payload,
      ContentType:
        data instanceof Buffer ? undefined : 'application/json; charset=utf-8'
    })
  );
  const result = await withResponseDetails('headObject', () =>
    client.headObject(params)
  );
  const cid = JSON.parse(result.ETag || 'null');

  return { cid, provider };
}

export function isConfigured() {
  return EVER_API_KEY && EVER_API_SECRET;
}
