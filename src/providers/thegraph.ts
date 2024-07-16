import { create } from 'ipfs-http-client';

export const provider = 'thegraph';
const client = create({
  url: 'https://api.thegraph.com/ipfs/api/v0',
  timeout: 10e3
});

export async function set(data: Buffer | object) {
  const input = data instanceof Buffer ? data : JSON.stringify(data);
  const result = await client.add(input, {
    pin: true
  });
  const cid = result.cid.toV0().toString();

  return { cid, provider };
}

export function isConfigured() {
  return true;
}
