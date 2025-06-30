import { capture } from '@snapshot-labs/snapshot-sentry';
import express from 'express';
import { create } from 'ipfs-http-client';
import fetch from 'node-fetch';
import gateways from '../gateways.json';
import {
  countOpenGatewaysRequest,
  ipfsGatewaysReturnCount,
  timeIpfsGatewaysResponse
} from '../metrics';
import useProxyCache from '../middlewares/useProxyCache';

const UNSUPPORTED_FILE_TYPE = 'unsupported file type';

const router = express.Router();
const graphIpfsClient = create({ url: 'https://api.thegraph.com/ipfs/api/v0' });

async function getFileFromGraphIpfs(cid: string) {
  const chunks: Uint8Array[] = [];
  for await (const chunk of graphIpfsClient.cat(cid)) {
    chunks.push(chunk);
  }

  try {
    const json = JSON.parse(Buffer.concat(chunks).toString('utf-8'));

    return {
      gateway: 'graph',
      json
    };
  } catch (e) {
    return Promise.reject(UNSUPPORTED_FILE_TYPE);
  }
}

router.get('^/ipfs/:cid([0-9a-zA-Z]+)$', useProxyCache, async (req, res) => {
  try {
    const result = await Promise.any([
      getFileFromGraphIpfs(req.params.cid),
      ...gateways.map(async gateway => {
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
            return Promise.reject(UNSUPPORTED_FILE_TYPE);
          }

          let json;
          try {
            json = await response.json();
          } catch (e: any) {
            return Promise.reject(e);
          }

          status = 1;
          return { gateway, json };
        } finally {
          end({ status });
          countOpenGatewaysRequest.dec({ name: gateway });
        }
      })
    ]);
    ipfsGatewaysReturnCount.inc({ name: result.gateway });

    return res.json(result.json);
  } catch (e) {
    if (e instanceof AggregateError) {
      return res.status(e.errors.includes(UNSUPPORTED_FILE_TYPE) ? 415 : 400).json();
    }

    capture(e);
    return res.status(500).json();
  }
});

export default router;
