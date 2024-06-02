import sharp from 'sharp';
import fs from 'fs';
import { createHash } from 'crypto';
import { Response } from 'express';

export const MAX = 10e4;
const MAX_IMAGE_DIMENSION = 1500;

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

export async function processImage(path: string) {
  const transformer = sharp({ failOnError: false })
    .resize({
      width: MAX_IMAGE_DIMENSION,
      height: MAX_IMAGE_DIMENSION,
      fit: 'inside'
    })
    .webp({ lossless: true });

  return await fs.createReadStream(path).pipe(transformer).toBuffer();
}
