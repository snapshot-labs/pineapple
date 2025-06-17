import { create } from 'ipfs-http-client';
import { UNSUPPORTED_FILE_TYPE_ERROR } from '..';

const client = create({ url: 'https://api.thegraph.com/ipfs/api/v0', timeout: 15e3 });

export const id = 'graph';

export async function resolve(cid: string) {
  const chunks: Uint8Array[] = [];
  for await (const chunk of client.cat(cid)) {
    chunks.push(chunk);
  }

  try {
    const json = JSON.parse(Buffer.concat(chunks).toString('utf-8'));

    return {
      proxy: id,
      json
    };
  } catch (e) {
    return Promise.reject(UNSUPPORTED_FILE_TYPE_ERROR);
  }
}
