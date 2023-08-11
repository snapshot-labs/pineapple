import express from 'express';
import Promise from 'bluebird';
import { capture } from '@snapshot-labs/snapshot-sentry';
import { MAX, rpcError, rpcSuccess } from './utils';
import { set as setAws } from './aws';
import uploadToProviders, { JSON_PROVIDERS } from './providers/';
import { providersInstrumentation } from './metrics';

const router = express.Router();

router.post('/', providersInstrumentation, async (req, res) => {
  const { id, params } = req.body;
  try {
    const size = Buffer.from(JSON.stringify(params)).length;
    if (size > MAX) return rpcError(res, 400, 'File too large', id);
    const result = await Promise.any(uploadToProviders(JSON_PROVIDERS, params));
    await setAws(result.cid, params);
    console.log('Success', result.provider, 'size', size);
    result.size = size;
    return rpcSuccess(res, result, id);
  } catch (e: any) {
    capture(e);
    return rpcError(res, 500, e, id);
  }
});

export default router;
