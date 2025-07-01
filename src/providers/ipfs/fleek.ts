import fleek from '@fleekhq/fleek-storage-js';
import { sha256 } from '../../utils';

const { FLEEK_API_KEY, FLEEK_API_SECRET } = process.env;

export const provider = 'fleek';
const config: any = {
  apiKey: FLEEK_API_KEY,
  apiSecret: FLEEK_API_SECRET
};

export async function set(data: Buffer | object) {
  const input = config;
  input.data = data instanceof Buffer ? data : JSON.stringify(data);
  input.key = sha256(input.data);
  const result = await fleek.upload(input);
  const cid = result.hashV0;

  return { cid, provider };
}

export function isConfigured() {
  return FLEEK_API_KEY && FLEEK_API_SECRET;
}
