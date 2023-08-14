import { capture } from '@snapshot-labs/snapshot-sentry';
import { sha256, MAX } from '../utils';
import { get, set } from '../aws';
import { ipfsGatewaysCacheHitCount, ipfsGatewaysCacheSize } from '../metrics';

export function cacheKey(key: string) {
  return sha256(key);
}

/**
 * This middleware serves a cache if it exists, else it will process the controller
 * and caches its results if it's less than 1MB
 */
export default async function useProxyCache(req, res, next) {
  const key = cacheKey(req.originalUrl);

  const cache = await get(`cache/${key}`);
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
          await set(`cache/${key}`, body);
        }
      } catch (e) {
        capture(e);
      }
    }

    return oldJson.call(res, body);
  };

  next();
}
