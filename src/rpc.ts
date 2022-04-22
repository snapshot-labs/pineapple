import express from 'express';
import { rpcError, rpcSuccess } from './utils';
import { set as setPinata } from './pinata';
import { set as setFleek } from './fleek';
import { set as setAws } from './aws';

const router = express.Router();

router.post('/', async (req, res) => {
  const { id, params } = req.body;
  try {
    const size = Buffer.from(JSON.stringify(params)).length;
    console.log('Size', size);
    if (size > 1e5) return rpcError(res, 500, 'too large', id);
    const result = await Promise.any([setPinata(params), setFleek(params)]);
    await setAws(result, params);
    console.log('Success', result);
    return rpcSuccess(res, result, id);
  } catch (e) {
    console.log(e);
    return rpcError(res, 500, e, id);
  }
});

export default router;
