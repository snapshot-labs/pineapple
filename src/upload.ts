import fs from 'fs';
import express from 'express';
import Promise from 'bluebird';
import multer from 'multer';
import sharp from 'sharp';
import { rpcError, rpcSuccess } from './utils';
import { set as setFleek } from './providers/fleek';
import { set as setInfura } from './providers/infura';
import { set as setPinata } from './providers/pinata';
import { set as set4everland } from './providers/4everland';
import { capture } from '@snapshot-labs/snapshot-sentry';

const MAX_INPUT_SIZE = 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1500;

const router = express.Router();
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: MAX_INPUT_SIZE }
}).single('file');

router.post('/upload', async (req, res) => {
  try {
    upload(req, res, async err => {
      if (err) return rpcError(res, 500, err.message, null);
      if (!req.file) return rpcError(res, 500, 'no file', null);

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
      const result = await Promise.any([
        setFleek(buffer),
        setInfura(buffer),
        setPinata(buffer),
        set4everland(buffer)
      ]);
      const file = {
        cid: result.cid,
        provider: result.provider
      };
      console.log('Upload success', result.provider, result.cid);
      return rpcSuccess(res, file, null);
    });
  } catch (e) {
    capture(e);
    return rpcError(res, 500, e, null);
  } finally {
    if (req.file) {
      await fs.promises.unlink(req.file.path as string);
    }
  }
});

export default router;
