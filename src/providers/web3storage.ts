import { Web3Storage, Blob, File } from 'web3.storage';
import { sha256 } from '../utils';

const provider = 'web3storage';
const client = new Web3Storage({ token: process.env.WEB3STORAGE_API_TOKEN || '' });

export async function set(json) {
  const start = Date.now();
  const blob = new Blob([JSON.stringify(json)], { type: 'application/json' });
  const files = [new File([blob], sha256(JSON.stringify(json)))];
  const cid = await client.put(files);
  const ms = Date.now() - start;
  console.log(cid, provider, ms);
  return { cid, provider, ms };
}
