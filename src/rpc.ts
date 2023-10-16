import express from 'express';
import { capture } from '@snapshot-labs/snapshot-sentry';
import { getMaxFileSize, rpcError, rpcSuccess } from './utils';
import { set as setAws } from './aws';
import uploadToProviders from './providers/';
import { JSON_PROVIDERS } from './providers/utils';

const router = express.Router();

router.post('/', async (req, res) => {
  const { id, params } = req.body;

  if (!params) {
    return rpcError(res, 400, 'Malformed body', id);
  }

  try {
    const size = Buffer.from(JSON.stringify(params)).length;
    if (size > getMaxFileSize('json')) return rpcError(res, 400, 'File too large', id);

    const result = await uploadToProviders(JSON_PROVIDERS, 'json', params);
    try {
      await setAws(result.cid, JSON.stringify(params));
    } catch (e: any) {
      capture(e);
    }

    return rpcSuccess(res, { ...result, size }, id);
  } catch (e: any) {
    capture(e);
    return rpcError(res, 500, e, id);
  }
});

export default router;
