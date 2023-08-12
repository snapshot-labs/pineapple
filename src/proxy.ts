import express from 'express';
import fetch from 'node-fetch';
import { capture } from '@snapshot-labs/snapshot-sentry';
import gateways from './gateways.json';
import { set, get } from './aws';
import { MAX, sha256 } from './utils';
import { ipfsGatewaysReturnCount, timeIpfsGatewaysResponse } from './metrics';

const router = express.Router();

router.get('/ipfs/*', async (req, res) => {
  const key = sha256(req.originalUrl);
  try {
    const cache = await get(`cache/${key}`);
    if (cache) return res.json(cache);

    const result = await Promise.any(
      gateways.map(async gateway => {
        const end = timeIpfsGatewaysResponse.startTimer({ name: gateway });
        const url = `https://${gateway}${req.originalUrl}`;
        const response = await fetch(url, { timeout: 15e3 });

        if (!response.ok) {
          return Promise.reject(response.status);
        }

        end();
        return { gateway, json: await response.json() };
      })
    );
    ipfsGatewaysReturnCount.inc({ name: result.gateway });

    try {
      const size = Buffer.from(JSON.stringify(result.json)).length;
      if (size <= MAX) await set(`cache/${key}`, result.json);
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
