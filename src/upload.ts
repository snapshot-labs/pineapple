import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { rpcError, rpcSuccess } from './utils';

const router = express.Router();
const fileSize = 1000 * 1000;
const upload = multer({ dest: 'uploads/', limits: { fileSize } });

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return rpcError(res, 500, 'no file', null);
  const path = `${req.file.destination}${req.file.filename}`;
  const readableStreamForFile = fs.createReadStream(path);
  try {
    const result = await pinata.pinFileToIPFS(readableStreamForFile);
    const file = {
      cid: result.IpfsHash,
      mimetype: req.file.mimetype,
      size: req.file.size
    };
    rpcSuccess(res, file, null);
  } catch (e) {
    console.log(e);
    return rpcError(res, 500, e, null);
  }
  await fs.unlinkSync(path);
});

export default router;
