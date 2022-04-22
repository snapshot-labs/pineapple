import fleek from '@fleekhq/fleek-storage-js';
import { sha256 } from './utils';

const config: any = {
  apiKey: process.env.FLEEK_API_KEY,
  apiSecret: process.env.FLEEK_API_SECRET
};

export async function set(json) {
  const input = config;
  input.data = JSON.stringify(json);
  input.key = sha256(input.data);
  const result = await fleek.upload(input);
  return result.hashV0;
}
