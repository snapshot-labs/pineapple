import express from 'express';
import Promise from 'bluebird';
import { rpcError, rpcSuccess } from './utils';
import { set as setPinata } from './providers/pinata';
import { set as setFleek } from './providers/fleek';
// import { set as setWeb3Storage } from './providers/web3storage';
import { set as setAws } from './aws';

const router = express.Router();

router.post('/', async (req, res) => {
  const { id, params } = req.body;
  try {
    const size = Buffer.from(JSON.stringify(params)).length;
    if (size > 1e4) return rpcError(res, 500, 'too large', id);
    const result = await Promise.any([setPinata(params), setFleek(params)]);
    await setAws(result.cid, params);
    console.log('Success', result.provider, 'size', size);
    result.size = size;
    return rpcSuccess(res, result, id);
  } catch (e) {
    console.log(e);
    return rpcError(res, 500, e, id);
  }
});

export default router;
