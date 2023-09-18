import express from 'express';
import fetch from 'node-fetch';
import { capture } from '@snapshot-labs/snapshot-sentry';
import gateways from './gateways.json';
import { set, get } from './aws';
import { MAX } from './utils';
import {
  ipfsGatewaysReturnCount,
  timeIpfsGatewaysResponse,
  countOpenGatewaysRequest
} from './metrics';

const router = express.Router();

router.get('^/ipfs/:cid([0-9a-zA-Z]+)$', async (req, res) => {
  const { cid } = req.params;
  try {
    const cache = await get(cid);
    if (cache) return res.json(cache);

    const result = await Promise.any(
      gateways.map(async gateway => {
        const end = timeIpfsGatewaysResponse.startTimer({ name: gateway });
        let status = 0;

        try {
          countOpenGatewaysRequest.inc({ name: gateway });

          const url = `https://${gateway}${req.originalUrl}`;
          const response = await fetch(url, { timeout: 15e3 });

          if (!response.ok) {
            return Promise.reject(response.status);
          }

          if (!['text/plain', 'application/json'].includes(response.headers.get('content-type'))) {
            return Promise.reject('');
          }

          let json;
          try {
            json = await response.json();
          } catch {
            return Promise.reject('');
          }

          status = 1;
          return { gateway, json };
        } finally {
          end({ status });
          countOpenGatewaysRequest.dec({ name: gateway });
        }
      })
    );
    ipfsGatewaysReturnCount.inc({ name: result.gateway });

    try {
      const size = Buffer.from(JSON.stringify(result.json)).length;
      if (size <= MAX) await set(cid, result.json);
    } catch (e) {
      capture(e);
    }

    return res.json(result.json);
  } catch (e) {
    if (e instanceof AggregateError) {
      return res.status(400).json();
    }

    capture(e);
    return res.status(500).json();
  }
});

export default router;
