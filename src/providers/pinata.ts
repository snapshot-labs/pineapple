import pinataSDK from '@pinata/sdk';
import { ReadStream } from 'fs';

const provider = 'pinata';
const client = pinataSDK(process.env.PINATA_API_KEY || '', process.env.PINATA_API_SECRET || '');

export async function set(data: ReadStream | object) {
  const start = Date.now();

  let result;
  if (data instanceof ReadStream) {
    result = await client.pinFileToIPFS(data);
  } else {
    result = await client.pinJSONToIPFS(data);
  }

  const cid = result.IpfsHash;
  const ms = Date.now() - start;
  console.log(cid, provider, ms);
  return { cid, provider, ms };
}
