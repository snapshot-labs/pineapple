import fetch from 'node-fetch';
import { UNSUPPORTED_FILE_TYPE_ERROR } from '..';
import { isJsonContentType } from '../../helpers/utils';

const TIMEOUT = 15e3;

export const id = 'ethswarm';

export async function resolve(hash: string): Promise<any> {
  const response = await fetch(`https://api.gateway.ethswarm.org/bzz/${hash}`, {
    timeout: TIMEOUT
  });

  if (!response.ok) {
    return Promise.reject(response.status);
  }

  if (!isJsonContentType(response.headers.get('content-type'))) {
    return Promise.reject(UNSUPPORTED_FILE_TYPE_ERROR);
  }

  try {
    const json = await response.json();
    return { proxy: id, json };
  } catch (e: any) {
    return Promise.reject(e);
  }
}
