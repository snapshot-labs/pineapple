import pinataSDK from '@pinata/sdk';

const provider = 'pinata';
const client = pinataSDK(process.env.PINATA_API_KEY || '', process.env.PINATA_API_SECRET || '');

export async function set(json) {
  const start = Date.now();
  const result = await client.pinJSONToIPFS(json);
  const cid = result.IpfsHash;
  const ms = Date.now() - start;
  console.log(cid, provider, ms);
  return { cid, provider, ms };
}
