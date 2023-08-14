import { capture } from '@snapshot-labs/snapshot-sentry';
import { sha256, MAX } from '../utils';
import { get, set } from '../aws';

export default async function useProxyCache(req, res, next) {
  const key = sha256(req.originalUrl);

  const cache = await get(`cache/${key}`);
  if (cache) {
    return res.json(cache);
  }

  const oldJson = res.json;
  res.json = async body => {
    res.locals.body = body;

    if (res.statusCode === 200 && body) {
      try {
        const size = Buffer.from(JSON.stringify(body)).length;
        if (size <= MAX) {
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
