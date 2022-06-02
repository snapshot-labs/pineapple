import express from 'express';
import Promise from 'bluebird';
import { MAX, rpcError, rpcSuccess } from './utils';
import { set as setPinata } from './providers/pinata';
import { set as setFleek } from './providers/fleek';
import { set as setInfura } from './providers/infura';
import { set as setAws } from './aws';

const router = express.Router();

router.post('/', async (req, res) => {
  const { id, params } = req.body;
  try {
    const size = Buffer.from(JSON.stringify(params)).length;
    if (size > MAX) return rpcError(res, 500, 'too large', id);
    const result = await Promise.any([setPinata(params), setFleek(params), setInfura(params)]);
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
