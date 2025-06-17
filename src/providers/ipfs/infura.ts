import { create } from 'ipfs-http-client';

const { INFURA_PROJECT_ID, INFURA_PROJECT_SECRET } = process.env;

export const id = 'infura';
const client = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  timeout: 10e3,
  headers: {
    authorization: `Basic ${Buffer.from(`${INFURA_PROJECT_ID}:${INFURA_PROJECT_SECRET}`).toString(
      'base64'
    )}`
  }
});

export async function set(data: Buffer | object) {
  const input = data instanceof Buffer ? data : JSON.stringify(data);
  const result = await client.add(input, {
    pin: true
  });
  const cid = result.cid.toV0().toString();

  return { cid, provider: id };
}

export function isConfigured(): boolean {
  return !!(INFURA_PROJECT_ID && INFURA_PROJECT_SECRET);
}
