import fs from 'fs';
import { capture } from '@snapshot-labs/snapshot-sentry';
import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import uploadToProviders from '../providers/';
import { IMAGE_PROVIDERS } from '../providers/utils';
import { rpcError, rpcSuccess } from '../utils';

const MAX_INPUT_SIZE = 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 1500;

const router = express.Router();
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: MAX_INPUT_SIZE }
}).single('file');

router.post('/upload', async (req, res) => {
  upload(req, res, async err => {
    try {
      if (err) return rpcError(res, 400, err.message);
      if (!req.file) return rpcError(res, 400, 'No file submitted');

      const transformer = sharp()
        .resize({
          width: MAX_IMAGE_DIMENSION,
          height: MAX_IMAGE_DIMENSION,
          fit: 'inside'
        })
        .webp({ lossless: true });

      const buffer = await fs
        .createReadStream(req.file?.path as string)
        .pipe(transformer)
        .toBuffer();

      const result = await uploadToProviders(IMAGE_PROVIDERS, 'image', buffer);
      const file = {
        cid: result.cid,
        provider: result.provider
      };

      return rpcSuccess(res, file);
    } catch (e: any) {
      if (e.message === 'Input buffer contains unsupported image format') {
        return rpcError(res, 415, 'Unsupported file type');
      }

      capture(e);
      return rpcError(res, 500, e);
    } finally {
      if (req.file) {
        await fs.promises.unlink(req.file.path as string);
      }
    }
  });
});

export default router;
