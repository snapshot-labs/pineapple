import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { sha256 } from '../utils';

const { EVER_API_KEY, EVER_API_SECRET } = process.env;

export const provider = '4everland';
const client = new S3Client({
  endpoint: 'https://endpoint.4everland.co',
  region: 'eu-west-2',
  credentials: {
    accessKeyId: EVER_API_KEY || '',
    secretAccessKey: EVER_API_SECRET || ''
  }
});

export async function set(data: Buffer | object) {
  const payload = data instanceof Buffer ? data : JSON.stringify(data);
  const params = {
    Bucket: process.env.EVER_BUCKET_NAME,
    Key: sha256(payload)
  };

  const putCommand = new PutObjectCommand({
    ...params,
    Body: payload,
    ContentType: data instanceof Buffer ? undefined : 'application/json; charset=utf-8'
  });
  await client.send(putCommand);

  const headCommand = new HeadObjectCommand(params);
  const result = await client.send(headCommand);
  const cid = JSON.parse(result.ETag || 'null');

  return { cid, provider };
}

export function isConfigured() {
  return EVER_API_KEY && EVER_API_SECRET;
}
