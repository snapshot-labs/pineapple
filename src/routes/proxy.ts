import { capture } from '@snapshot-labs/snapshot-sentry';
import express from 'express';
import useProxyCache from '../middlewares/useProxyCache';
import { resolveFromProxies, UNSUPPORTED_FILE_TYPE_ERROR } from '../proxies';
import { Protocol } from '../proxies/types';

const router = express.Router();

router.get<{ protocol: Protocol; cid: string }>(
  '^/:protocol(ipfs|swarm)/:cid([0-9a-zA-Z]+)$',
  useProxyCache,
  async (req, res) => {
    try {
      const result = await resolveFromProxies(req.params.protocol, req.params.cid);

      return res.json(result.json);
    } catch (e) {
      if (e instanceof AggregateError) {
        return res.status(e.errors.includes(UNSUPPORTED_FILE_TYPE_ERROR) ? 415 : 400).json();
      }

      capture(e);
      return res.status(500).json();
    }
  }
);

export default router;
