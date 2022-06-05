import { ReadStream } from 'fs';
import fleek from '@fleekhq/fleek-storage-js';
import { sha256, streamToBuffer } from '../utils';

const provider = 'fleek';
const config: any = {
  apiKey: process.env.FLEEK_API_KEY,
  apiSecret: process.env.FLEEK_API_SECRET
};

export async function set(data: ReadStream | object) {
  const start = Date.now();
  const input = config;
  input.data = data instanceof ReadStream ? await streamToBuffer(data) : JSON.stringify(data);
  input.key = sha256(input.data);
  const result = await fleek.upload(input);
  const cid = result.hashV0;
  const ms = Date.now() - start;
  console.log(cid, provider, ms);
  return { cid, provider, ms };
}
