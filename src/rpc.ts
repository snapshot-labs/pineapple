import express from 'express';
import Promise from 'bluebird';
import { capture } from '@snapshot-labs/snapshot-sentry';
import { MAX, rpcError, rpcSuccess } from './utils';
import { set as setAws } from './aws';
import { stats } from './stats';
import { JSON_PROVIDERS, default as set } from './providers/';

const router = express.Router();

router.post('/', async (req, res) => {
  const { id, params } = req.body;
  try {
    const size = Buffer.from(JSON.stringify(params)).length;
    if (size > MAX) return rpcError(res, 400, 'File too large', id);
    const result = await Promise.any(set(JSON_PROVIDERS, params));
    await setAws(result.cid, params);
    stats.providers[result.provider] = (stats.providers[result.provider] || 0) + 1;
    stats.total += 1;
    console.log('Success', result.provider, 'size', size, 'ms', result.ms);
    result.size = size;
    return rpcSuccess(res, result, id);
  } catch (e: any) {
    capture(e);
    return rpcError(res, 500, e, id);
  }
});

export default router;
