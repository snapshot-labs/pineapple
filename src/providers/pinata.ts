import pinataSDK from '@pinata/sdk';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';
const provider = 'pinata';
const client = new pinataSDK(process.env.PINATA_API_KEY || '', process.env.PINATA_API_SECRET || '');

export async function set(data: Buffer | object) {
  const start = Date.now();

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
  const ms = Date.now() - start;
  // console.log(cid, provider, ms);
  return { cid, provider, ms };
}
