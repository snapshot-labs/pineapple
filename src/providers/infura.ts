import { create } from 'ipfs-http-client';

const { INFURA_PROJECT_ID, INFURA_PROJECT_SECRET } = process.env;

export const provider = 'infura';
const client = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: `Basic ${Buffer.from(`${INFURA_PROJECT_ID}:${INFURA_PROJECT_SECRET}`).toString(
      'base64'
    )}`
  }
});

export async function set(data: Buffer | object) {
  const start = Date.now();
  const input = data instanceof Buffer ? data : JSON.stringify(data);
  const result = await client.add(input, {
    pin: true
  });
  const cid = result.cid.toV0().toString();
  const ms = Date.now() - start;
  // console.log(cid, provider, ms);
  return { cid, provider, ms };
}

export function isConfigured() {
  return INFURA_PROJECT_ID && INFURA_PROJECT_SECRET;
}
