import { randomUUID } from 'crypto';
import { Readable } from 'stream';
import pinataSDK from '@pinata/sdk';

const { PINATA_API_KEY, PINATA_API_SECRET } = process.env;

export const id = 'pinata';
const client = pinataSDK(PINATA_API_KEY || '', PINATA_API_SECRET || '');

export async function set(data: Buffer | object) {
  let result;
  if (data instanceof Buffer) {
    const stream = Readable.from(data);
    // @ts-ignore
    stream.path = randomUUID();
    result = await client.pinFileToIPFS(stream);
  } else {
    result = await client.pinJSONToIPFS(data);
  }

  const cid = result.IpfsHash;

  return { cid, provider: id };
}

export function isConfigured(): boolean {
  return !!(PINATA_API_KEY && PINATA_API_SECRET);
}
