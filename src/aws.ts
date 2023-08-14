import * as AWS from '@aws-sdk/client-s3';
import { Readable } from 'stream';

let client;
const region = process.env.AWS_REGION;
const endpoint = process.env.AWS_ENDPOINT || undefined;
if (region) client = new AWS.S3({ region, endpoint });
const dir = 'pineapple';

async function streamToString(stream: Readable): Promise<string> {
  return await new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

export async function set(key, value) {
  try {
    return await client.putObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `public/${dir}/${key}`,
      Body: JSON.stringify(value),
      ContentType: 'application/json; charset=utf-8'
    });
  } catch (e) {
    console.log('Store cache failed', e);
    throw e;
  }
}

export async function get(key) {
  try {
    const { Body } = await client.getObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `public/${dir}/${key}`
    });
    const str = await streamToString(Body);
    return JSON.parse(str);
  } catch (e) {
    return false;
  }
}

export async function remove(key) {
  try {
    return await client.deleteObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `public/${dir}/${key}`
    });
  } catch (e: any) {
    return false;
  }
}
