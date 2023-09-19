import { capture } from '@snapshot-labs/snapshot-sentry';
import { MAX } from '../utils';
import { get, set } from '../aws';
import { ipfsGatewaysCacheHitCount, ipfsGatewaysCacheSize } from '../metrics';

/**
 * This middleware serves a cache if it exists, else it will process the controller
 * and caches its results if it's less than 1MB
 */
export default async function useProxyCache(req, res, next) {
  const { cid } = req.params;

  const cache = await get(cid);
  if (cache) {
    const cachedSize = Buffer.from(JSON.stringify(cache)).length;
    ipfsGatewaysCacheHitCount.inc({ status: 'HIT' });
    ipfsGatewaysCacheSize.inc({ status: 'HIT' }, cachedSize);
    return res.json(cache);
  }

  const oldJson = res.json;
  res.json = async body => {
    res.locals.body = body;

    if (res.statusCode === 200 && body) {
      try {
        const size = Buffer.from(JSON.stringify(body)).length;
        if (size <= MAX) {
          ipfsGatewaysCacheHitCount.inc({ status: 'MISS' });
          ipfsGatewaysCacheSize.inc({ status: 'MISS' }, size);
          await set(cid, body);
        }
      } catch (e) {
        capture(e);
      }
    }

    return oldJson.call(res, body);
  };

  next();
}
