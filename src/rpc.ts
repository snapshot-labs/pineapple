import express from 'express';
import { MAX, rpcError, rpcSuccess } from './utils';
import { set as setFleek } from './providers/fleek';
import { set as setInfura } from './providers/infura';
import { set as setWeb3Storage } from './providers/web3storage';
import { set as set4everland } from './providers/4everland';
import { set as setAws } from './aws';
import { stats } from './stats';
import { capture } from '@snapshot-labs/snapshot-sentry';

const router = express.Router();

router.post('/', async (req, res) => {
  const { id, params } = req.body;

  if (!params) {
    return rpcError(res, 400, 'Malformed body', id);
  }

  try {
    const size = Buffer.from(JSON.stringify(params)).length;
    if (size > MAX) return rpcError(res, 400, 'File too large', id);
    const result = await Promise.any([
      setFleek(params),
      setInfura(params),
      setWeb3Storage(params),
      set4everland(params)
    ]);
    try {
      await setAws(result.cid, params);
    } catch (e: any) {
      capture(e);
    }
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
