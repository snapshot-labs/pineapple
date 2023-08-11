import express from 'express';
import fetch from 'node-fetch';
import Promise from 'bluebird';
import gateways from './gateways.json';
import { set, get } from './aws';
import { MAX, sha256 } from './utils';
import { capture } from '@snapshot-labs/snapshot-sentry';

const router = express.Router();

router.get('/ipfs/*', async (req, res) => {
  const key = sha256(req.originalUrl);
  try {
    const cache = await get(`cache/${key}`);
    if (cache) return res.json(cache);

    let json;

    try {
      json = await Promise.any(
        gateways.map(async gateway => {
          const url = `https://${gateway}${req.originalUrl}`;
          const response = await fetch(url, { timeout: 15e3 });

          if (!response.ok) {
            return Promise.reject(response.status);
          }
          return response.json();
        })
      );
      res.json(json);
    } catch (e: any) {
      return res.status(400).json();
    }

    try {
      const size = Buffer.from(JSON.stringify(json)).length;
      if (size <= MAX) await set(`cache/${key}`, json);
    } catch (e: any) {
      capture(e);
    }
  } catch (e) {
    capture(e);
    return res.status(500).json();
  }
});

export default router;
