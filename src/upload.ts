import fs from 'fs';
import express from 'express';
import multer from 'multer';
import { capture } from '@snapshot-labs/snapshot-sentry';
import { getMaxFileSize, rpcError, rpcSuccess, preProcessImage } from './utils';
import uploadToProviders from './providers/';
import { IMAGE_PROVIDERS } from './providers/utils';
import { set as setAws } from './aws';

const router = express.Router();
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: getMaxFileSize('image') }
}).single('file');

router.post('/upload', async (req, res) => {
  upload(req, res, async err => {
    try {
      if (err) return rpcError(res, 400, err.message);
      if (!req.file) return rpcError(res, 400, 'No file submitted');

      const buffer = await preProcessImage(await fs.createReadStream(req.file?.path as string));
      const result = await uploadToProviders(IMAGE_PROVIDERS, 'image', buffer);
      const file = {
        cid: result.cid,
        provider: result.provider
      };

      try {
        await setAws(result.cid, buffer);
      } catch (e: any) {
        capture(e);
      }

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
