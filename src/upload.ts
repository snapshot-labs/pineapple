import fs from 'fs';
import express from 'express';
import multer from 'multer';
import { capture } from '@snapshot-labs/snapshot-sentry';
import { rpcError, rpcSuccess, processImage } from './utils';
import uploadToProviders from './providers/';
import { IMAGE_PROVIDERS } from './providers/utils';

const MAX_INPUT_SIZE = 1024 * 1024;

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

      let processedImage: Buffer;
      try {
        processedImage = await processImage(req.file?.path);
      } catch (e: any) {
        if (e.message === 'Input buffer contains unsupported image format') {
          return rpcError(res, 415, 'Unsupported file type');
        }
        throw e;
      }

      const result = await uploadToProviders(IMAGE_PROVIDERS, 'image', processedImage);
      const file = {
        cid: result.cid,
        provider: result.provider
      };

      return rpcSuccess(res, file);
    } catch (e: any) {
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
