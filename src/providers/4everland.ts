import { S3 } from '@aws-sdk/client-s3';
import { sha256 } from '../utils';

const provider = '4everland';
const client = new S3({
  endpoint: 'https://endpoint.4everland.co',
  region: 'eu-west-2',
  credentials: {
    accessKeyId: process.env.EVER_API_KEY || '',
    secretAccessKey: process.env.EVER_API_SECRET || ''
  }
});

export async function set(data: Buffer | object) {
  const start = Date.now();
  const payload = data instanceof Buffer ? data : JSON.stringify(data);
  const params = {
    Bucket: process.env.EVER_BUCKET_NAME,
    Key: sha256(payload)
  };
  await client.putObject({
    ...params,
    Body: payload,
    ContentType: data instanceof Buffer ? null : 'application/json; charset=utf-8'
  });
  const result = await client.headObject(params);
  const cid = JSON.parse(result.ETag || 'null');
  const ms = Date.now() - start;
  // console.log(cid, provider, ms);
  return { cid, provider, ms };
}
