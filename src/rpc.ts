import express from 'express';
import Promise from 'bluebird';
import { MAX, rpcError, rpcSuccess } from './utils';
import { set as setFleek } from './providers/fleek';
import { set as setInfura } from './providers/infura';
import { set as setWeb3Storage } from './providers/web3storage';
import { set as setAws } from './aws';
import { stats } from './stats';

const router = express.Router();

router.post('/', async (req, res) => {
  const { id, params } = req.body;
  try {
    const size = Buffer.from(JSON.stringify(params)).length;
    if (size > MAX) return rpcError(res, 500, 'too large', id);
    const result = await Promise.any([setFleek(params), setInfura(params), setWeb3Storage(params)]);
    await setAws(result.cid, params);
    stats.providers[result.provider] = (stats.providers[result.provider] || 0) + 1;
    stats.total += 1;
    console.log('Success', result.provider, 'size', size);
    result.size = size;
    return rpcSuccess(res, result, id);
  } catch (e) {
    console.log(e);
    return rpcError(res, 500, e, id);
  }
});

export default router;
