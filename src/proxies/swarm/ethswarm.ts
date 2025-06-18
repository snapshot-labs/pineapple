import fetch from 'node-fetch';
import { UNSUPPORTED_FILE_TYPE_ERROR } from '..';

const TIMEOUT = 15e3;
const SUPPORTED_CONTENT_TYPES = ['text/plain', 'application/json'] as const;

export const id = 'swarmy';

export async function resolve(hash: string): Promise<any> {
  const response = await fetch(`https://api.gateway.ethswarm.org/bzz/${hash}`, {
    timeout: TIMEOUT
  });

  if (!response.ok) {
    return Promise.reject(response.status);
  }

  const contentType = response.headers.get('content-type')?.split(';')[0];
  if (!contentType || !SUPPORTED_CONTENT_TYPES.includes(contentType as any)) {
    return Promise.reject(UNSUPPORTED_FILE_TYPE_ERROR);
  }

  try {
    const json = await response.json();
    return { proxy: id, json };
  } catch (e: any) {
    return Promise.reject(e);
  }
}
