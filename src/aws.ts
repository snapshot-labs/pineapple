import * as AWS from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { getContentType } from './utils';

let client;
const region = process.env.AWS_REGION;
const endpoint = process.env.AWS_ENDPOINT || undefined;
if (region) client = new AWS.S3({ region, endpoint });
const dir = 'pineapple';

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return await new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

export async function set(key: string, value: Buffer) {
  if (!client) {
    return Promise.reject('Cache not setup');
  }

  try {
    return await client.putObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `public/${dir}/${key}`,
      Body: value,
      ContentType: await getContentType(value)
    });
  } catch (e) {
    throw e;
  }
}

export async function get(key: string) {
  if (!client) {
    return Promise.reject('Cache not setup');
  }

  try {
    const { Body } = await client.getObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `public/${dir}/${key}`
    });
    return await streamToBuffer(Body);
  } catch (e) {
    return Promise.reject('Get cache failed');
  }
}

export async function remove(key) {
  if (!client) {
    return Promise.reject('Cache not setup');
  }

  try {
    return await client.deleteObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `public/${dir}/${key}`
    });
  } catch (e: any) {
    return false;
  }
}
