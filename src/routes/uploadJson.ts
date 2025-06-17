import { capture } from '@snapshot-labs/snapshot-sentry';
import express from 'express';
import { set as setAws } from '../helpers/aws';
import { MAX, rpcError, rpcSuccess } from '../helpers/utils';
import uploadToProviders, { DEFAULT_PROTOCOL } from '../providers/';

const router = express.Router();

router.post('/', async (req, res) => {
  const { id, params, protocol = DEFAULT_PROTOCOL } = req.body;

  if (!params) {
    return rpcError(res, 400, 'Malformed body', id);
  }

  try {
    const size = Buffer.from(JSON.stringify(params)).length;
    if (size > MAX) return rpcError(res, 400, 'File too large', id);

    const result = await uploadToProviders({
      protocol,
      type: 'json',
      params
    });
    try {
      await setAws(result.cid, params);
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
