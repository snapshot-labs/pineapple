import { capture } from '@snapshot-labs/snapshot-sentry';
import { getContentType, getMaxFileSize } from '../utils';
import { get, set } from '../aws';
import { ipfsGatewaysCacheHitCount, ipfsGatewaysCacheSize } from '../metrics';

/**
 * This middleware serves a cache if it exists, else it will process the controller
 * and caches its results if it's less than 1MB for image and 100kb for JSON
 */
export default async function useProxyCache(req, res, next) {
  const { cid } = req.params;

  try {
    const cache = await get(cid);

    updateCacheMetrics('HIT', cache.length);
    res.set('Content-Type', await getContentType(cache));
    return res.send(cache);
  } catch (e) {
    // Cache does not exist
  }

  const oldSend = res.send;
  res.send = async buffer => {
    res.locals.buffer = buffer;

    if (res.statusCode === 200 && buffer) {
      try {
        const contentType = await getContentType(buffer);
        const size = buffer.length;

        if (size <= getMaxFileSize(contentType)) {
          updateCacheMetrics('HIT', size);
          await set(cid, buffer);
        }
      } catch (e) {
        capture(e);
      }
    }

    return oldSend.call(res, buffer);
  };

  next();
}

function updateCacheMetrics(status: 'HIT' | 'MISS', size: number) {
  ipfsGatewaysCacheHitCount.inc({ status });
  ipfsGatewaysCacheSize.inc({ status }, size);
}
