import * as AWS from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import constants from './constants.json';

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

export async function set(key: string, value: string | Buffer) {
  if (!client) {
    return Promise.reject('Cache not setup');
  }

  try {
    return await client.putObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `public/${dir}/${key}`,
      Body: value,
      ContentType: constants[value instanceof Buffer ? 'image' : 'json'].contentType
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
    const { Body, ContentType } = await client.getObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `public/${dir}/${key}`
    });
    const result = await streamToBuffer(Body);

    if (ContentType.includes(constants.json.contentType)) {
      return result.toString('utf8');
    }
    return result;
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
