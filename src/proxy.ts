import express from 'express';
import fetch from 'cross-fetch';
import Promise from 'bluebird';
import gateways from './gateways.json';
import { set, get } from './aws';
import { MAX, sha256 } from './utils';

const router = express.Router();

router.get('/ipfs/*', async (req, res) => {
  const key = sha256(req.originalUrl);
  try {
    const cache = await get(`cache/${key}`);
    if (cache) return res.json(cache);
    const json = await Promise.any(
      gateways.map((gateway) => {
        const url = `https://${gateway}${req.originalUrl}`;
        return fetch(url).then((res) => res.json());
      })
    );
    res.json(json);
    const size = Buffer.from(JSON.stringify(json)).length;
    if (size <= MAX) await set(`cache/${key}`, json);
  } catch (e) {
    return res.status(500).json();
  }
});

export default router;
