import fleek from '@fleekhq/fleek-storage-js';
import { sha256 } from './utils';

const provider = 'fleek';
const config: any = {
  apiKey: process.env.FLEEK_API_KEY,
  apiSecret: process.env.FLEEK_API_SECRET
};

export async function set(json) {
  const start = Date.now();
  const input = config;
  input.data = JSON.stringify(json);
  input.key = sha256(input.data);
  const result = await fleek.upload(input);
  const cid = result.hashV0;
  const ms = Date.now() - start;
  console.log(cid, provider, ms);
  return { cid, provider, ms };
}
