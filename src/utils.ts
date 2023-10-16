import { createHash } from 'crypto';
import { Response } from 'express';
import FileType from 'file-type';
import constants from './constants.json';

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

export async function getContentType(input: Buffer) {
  try {
    JSON.parse(input.toString());
    return 'application/json';
  } catch (e) {
    return (await FileType.fromBuffer(input))?.mime;
  }
}

export function getMaxFileSize(contentType: string | undefined): number {
  if ((contentType || '').split('/')[0] === 'image') {
    return constants.image.maxFileSize;
  }

  return constants.json.maxFileSize;
}
