import { createHash } from 'crypto';
import { Response } from 'express';

export const MAX = 20e10; // 20 MB

export function rpcSuccess(res: Response, result: any, id = '') {
  res.json({
    jsonrpc: '2.0',
    result,
    id
  });
}

export function rpcError(res: Response, code: number, e: Error | string, id = null) {
  res.status(code).json({
    jsonrpc: '2.0',
    error: {
      code,
      message: e,
      data: {}
    },
    id
  });
}

export function sha256(input: string | Buffer) {
  return createHash('sha256').update(input).digest('hex');
}

export function getJsonSize(data: any): number {
  return Buffer.from(JSON.stringify(data)).length;
}

export function getDataSize(data: Buffer | any): number {
  return data instanceof Buffer ? data.length : getJsonSize(data);
}
