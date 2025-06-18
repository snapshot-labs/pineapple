import { capture } from '@snapshot-labs/snapshot-sentry';
import { get, set } from '../helpers/aws';
import { proxyCacheHitCount, proxyCacheSize } from '../helpers/metrics';
import { getJsonSize, MAX } from '../helpers/utils';

/**
 * This middleware serves a cache if it exists, else it will process the controller
 * and caches its results if it's less than 1MB
 */
export default async function useProxyCache(req, res, next) {
  const { cid, protocol } = req.params;

  const cache = await get(cid);
  if (cache) {
    const cachedSize = getJsonSize(cache);
    proxyCacheHitCount.inc({ status: 'HIT', protocol });
    proxyCacheSize.inc({ status: 'HIT', protocol }, cachedSize);
    return res.json(cache);
  }

  const oldJson = res.json;
  res.json = async body => {
    res.locals.body = body;

    if (res.statusCode === 200 && body) {
      try {
        const size = getJsonSize(body);
        if (size <= MAX) {
          proxyCacheHitCount.inc({ status: 'MISS', protocol });
          proxyCacheSize.inc({ status: 'MISS', protocol }, size);
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
