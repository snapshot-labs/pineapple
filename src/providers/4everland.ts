import { S3 } from "@aws-sdk/client-s3";
import { sha256 } from '../utils';

const provider = '4everland';
const config: any = {
  apiKey: process.env.EVER_API_KEY,
  apiSecret: process.env.EVER_API_SECRET,
  bucketName: process.env.EVER_BUCKET_NAME
};
const client = new S3({
  endpoint: "https://endpoint.4everland.co",
  region: "eu-west-2",
  credentials: {
    accessKeyId: config.apiKey,
    secretAccessKey: config.apiSecret,
  },
});

export async function set(data: Buffer | object) {
  const start = Date.now();
  const input = config;
  input.data = data instanceof Buffer ? data : JSON.stringify(data);
  input.key = sha256(input.data);
  const params = {
    Bucket: config.bucketName,
    Key: input.key,
  };
  await client.putObject({
    ...params,
    Body: input.data,
    ContentType: 'application/json; charset=utf-8'
  });
  const result = await client.headObject(params);
  const cid = JSON.parse(result.ETag || 'null');
  const ms = Date.now() - start;
  // console.log(cid, provider, ms);
  return { cid, provider, ms };
}
