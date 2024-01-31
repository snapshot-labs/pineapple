import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { capture } from '@snapshot-labs/snapshot-sentry';

let client: S3Client;

const REGION = process.env.AWS_REGION;
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const DIR = 'pineapple';

if (REGION && ACCESS_KEY_ID && SECRET_ACCESS_KEY) {
  client = new S3Client({ region: REGION, endpoint: process.env.AWS_ENDPOINT });
}

export async function set(key: string, value: any): Promise<boolean> {
  if (!client) return false;

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: path(key),
      Body: JSON.stringify(value),
      ContentType: 'application/json; charset=utf-8'
    });

    await client.send(command);

    return true;
  } catch (e) {
    capture(e, { key, path: path(key) });
    console.log('[aws] Cache set failed', e);
    throw e;
  }
}

export async function get(key: string) {
  if (!client) return false;

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: path(key)
    });
    const response = await client.send(command);

    if (!response.Body) {
      return false;
    }

    return await response.Body.transformToString();
  } catch (e: any) {
    if (e['$metadata']?.httpStatusCode !== 404) {
      capture(e, { key, path: path(key) });
      console.error('[aws] Cache get failed', e);
    }

    return false;
  }
}

export async function remove(key: string): Promise<boolean> {
  if (!client) return false;

  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: path(key)
    });
    await client.send(command);

    return true;
  } catch (e: any) {
    if (e['$metadata']?.httpStatusCode !== 404) {
      capture(e, { key, path: path(key) });
      console.error('[aws] Cache delete failed', e);
    }

    return false;
  }
}

function path(key: string) {
  return `public/${DIR}/${key}`;
}
