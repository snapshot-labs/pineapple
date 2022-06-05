import { ReadStream } from 'fs';
import { Web3Storage, Blob, File } from 'web3.storage';
import { sha256, streamToBuffer } from '../utils';

const provider = 'web3storage';
const client = new Web3Storage({ token: process.env.WEB3STORAGE_API_TOKEN || '' });

export async function set(data: ReadStream | object) {
  const start = Date.now();

  let file;
  if (data instanceof ReadStream) {
    const content = await streamToBuffer(data);
    const blob = new Blob([content]);
    file = new File([blob], sha256(content));
  } else {
    const content = JSON.stringify(data);
    const blob = new Blob([content]);
    file = new File([blob], sha256(content));
  }

  const cid = await client.put([file], { wrapWithDirectory: false });
  const ms = Date.now() - start;
  console.log(cid, provider, ms);
  return { cid, provider, ms };
}
