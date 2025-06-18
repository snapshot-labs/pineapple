import { createHash } from 'crypto';
import { Response } from 'express';

export const MAX = 20e10; // 20 MB
const JSON_CONTENT_TYPES = ['text/plain', 'application/json'] as const;

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
  return createHash('sha256')
    .update(input as any)
    .digest('hex');
}

export function isJsonContentType(contentType: string | null): boolean {
  if (!contentType) {
    return false;
  }

  const mainContentType = contentType.split(';')[0].trim();
  return JSON_CONTENT_TYPES.some(supportedType => mainContentType === supportedType);
}

export function getJsonSize(data: any): number {
  return Buffer.from(JSON.stringify(data)).length;
}

export function getDataSize(data: Buffer | any): number {
  return data instanceof Buffer ? data.length : getJsonSize(data);
}
