import fs from 'fs';
import express from 'express';
import Promise from 'bluebird';
import multer from 'multer';
import sharp from 'sharp';
import { rpcError, rpcSuccess } from './utils';
import { set as setFleek } from './providers/fleek';
import { set as setInfura } from './providers/infura';
import { set as setPinata } from './providers/pinata';

const MAX_INPUT_SIZE = 1024 * 1024;
const MAX_IMAGE_DIMENSION = 500;

const transformer = sharp()
  .resize({ width: MAX_IMAGE_DIMENSION, height: MAX_IMAGE_DIMENSION, fit: 'inside' })
  .webp({ lossless: true });

const router = express.Router();
const upload = multer({ dest: 'uploads/', limits: { fileSize: MAX_INPUT_SIZE } });

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return rpcError(res, 500, 'no file', null);

  try {
    const buffer = await fs.createReadStream(req.file.path).pipe(transformer).toBuffer();
    const result = await Promise.any([setFleek(buffer), setInfura(buffer), setPinata(buffer)]);
    const file = {
      cid: result.cid,
      provider: result.provider
    };
    return rpcSuccess(res, file, null);
  } catch (e) {
    console.log(e);
    return rpcError(res, 500, e, null);
  } finally {
    await fs.promises.unlink(req.file.path);
  }
});

export default router;
