import fs from 'fs';
import express from 'express';
import Promise from 'bluebird';
import multer from 'multer';
import { rpcError, rpcSuccess } from './utils';
import { set as setFleek } from './providers/fleek';
import { set as setPinata } from './providers/pinata';

const router = express.Router();

const MAX_SIZE = 1024 * 1024;

const upload = multer({ dest: 'uploads/', limits: { fileSize: MAX_SIZE } });

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return rpcError(res, 500, 'no file', null);

  try {
    const stream = fs.createReadStream(req.file.path);
    const result = await Promise.any([setFleek(stream), setPinata(stream)]);
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
