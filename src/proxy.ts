import express from 'express';
import fetch from 'cross-fetch';
import Promise from 'bluebird';
import { capture } from '@snapshot-labs/snapshot-sentry';
import gateways from './gateways.json';
import { set, get } from './aws';
import { MAX, sha256 } from './utils';
import {
  ipfsGatewaysReturnCount,
  timeIpfsGatewaysResponse,
  countOpenGatewaysRequest
} from './metrics';

const router = express.Router();

router.get('/ipfs/*', async (req, res) => {
  const key = sha256(req.originalUrl);
  try {
    const cache = await get(`cache/${key}`);
    if (cache) return res.json(cache);

    const result = await Promise.any(
      gateways.map(async gateway => {
        const end = timeIpfsGatewaysResponse.startTimer({ name: gateway });

        try {
          countOpenGatewaysRequest.inc({ name: gateway });

          const url = `https://${gateway}${req.originalUrl}`;
          const response = await fetch(url);

          return { gateway, json: await response.json() };
        } finally {
          end();
          countOpenGatewaysRequest.dec({ name: gateway });
        }
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
    capture(e);
    return res.status(500).json();
  }
});

export default router;
