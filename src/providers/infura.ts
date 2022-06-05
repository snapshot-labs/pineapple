import { ReadStream } from 'fs';
import { create } from 'ipfs-http-client';

const { INFURA_PROJECT_ID: PROJECT_ID, INFURA_PROJECT_SECRET: PROJECT_SECRET } = process.env;

const provider = 'infura';
const client = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: `Basic ${Buffer.from(`${PROJECT_ID}:${PROJECT_SECRET}`).toString('base64')}`
  }
});

export async function set(data: ReadStream | object) {
  const start = Date.now();
  const input = data instanceof ReadStream ? data : JSON.stringify(data);
  const result = await client.add(input, {
    pin: true
  });
  const cid = result.cid.toV0().toString();
  const ms = Date.now() - start;
  console.log(cid, provider, ms);
  return { cid, provider, ms };
}
