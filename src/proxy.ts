import express from 'express';
import fetch from 'cross-fetch';
import Promise from 'bluebird';
import { capture } from '@snapshot-labs/snapshot-sentry';
import gateways from './gateways.json';
import { set, get } from './aws';
import { MAX, sha256 } from './utils';
import { timeIpfsGatewaysResponse } from './metrics';

const router = express.Router();

router.get('/ipfs/*', async (req, res) => {
  const key = sha256(req.originalUrl);
  try {
    const cache = await get(`cache/${key}`);
    if (cache) return res.json(cache);
    const json = await Promise.any(
      gateways.map(async gateway => {
        const end = timeIpfsGatewaysResponse.startTimer({ name: gateway });
        const url = `https://${gateway}${req.originalUrl}`;
        await fetch(url);
        end();
        return res.json();
      })
    );
    res.json(json);
    const size = Buffer.from(JSON.stringify(json)).length;
    if (size <= MAX) await set(`cache/${key}`, json);
  } catch (e) {
    capture(e);
    return res.status(500).json();
  }
});

export default router;
