import { Blob, File, Web3Storage } from 'web3.storage';
import { sha256 } from '../../helpers/utils';

const { WEB3STORAGE_API_TOKEN } = process.env;

export const id = 'web3storage';
const client = new Web3Storage({ token: WEB3STORAGE_API_TOKEN || '' });

export async function set(data: Buffer | object) {
  let file;
  if (data instanceof Buffer) {
    const blob = new Blob([data]);
    file = new File([blob], sha256(data));
  } else {
    const content = JSON.stringify(data);
    const blob = new Blob([content]);
    file = new File([blob], sha256(content));
  }

  const cid = await client.put([file], { wrapWithDirectory: false });

  return { cid, provider: id };
}

export function isConfigured(): boolean {
  return !!WEB3STORAGE_API_TOKEN;
}
