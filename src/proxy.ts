import express from 'express';
import fetch from 'cross-fetch';
import Promise from 'bluebird';
import { capture } from '@snapshot-labs/snapshot-sentry';
import gateways from './gateways.json';
import {
  ipfsGatewaysReturnCount,
  timeIpfsGatewaysResponse,
  countOpenGatewaysRequest
} from './metrics';
import useProxyCache from './middlewares/useProxyCache';

const router = express.Router();

router.get('/ipfs/*', useProxyCache, async (req, res) => {
  try {
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

    return res.json(result.json);
  } catch (e) {
    capture(e);
    return res.status(500).json();
  }
});

export default router;
