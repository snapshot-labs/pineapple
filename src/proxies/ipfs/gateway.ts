import fetch from 'node-fetch';
import { UNSUPPORTED_FILE_TYPE_ERROR } from '..';
import { Response } from '../types';

const GATEWAYS = [
  'cloudflare-ipfs.com',
  'cf-ipfs.com',
  'ipfs.io',
  'ipfs.fleek.co',
  'gateway.pinata.cloud',
  'dweb.link',
  'ipfs.infura.io',
  'snapshot.4everland.link'
] as const;

const TIMEOUT = 15e3;
const SUPPORTED_CONTENT_TYPES = ['text/plain', 'application/json'] as const;

export const id = 'gateway';

export function resolve(cid: string): Promise<Response>[] {
  return GATEWAYS.map(async gateway => {
    const response = await fetch(`https://${gateway}/ipfs/${cid}`, { timeout: TIMEOUT });

    if (!response.ok) {
      return Promise.reject(response.status);
    }

    if (!SUPPORTED_CONTENT_TYPES.includes(response.headers.get('content-type'))) {
      return Promise.reject(UNSUPPORTED_FILE_TYPE_ERROR);
    }

    try {
      const json = await response.json();
      return { proxy: id, json };
    } catch (e: any) {
      return Promise.reject(e);
    }
  });
}
