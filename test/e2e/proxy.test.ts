import request from 'supertest';
import { cacheKey } from '../../src/middlewares/useProxyCache';
import { set, get, remove } from '../../src/aws';

const HOST = `http://localhost:${process.env.PORT || 3003}`;

describe('GET /ipfs/*', () => {
  describe('when the IPFS cid exists', () => {
    const path = '/ipfs/bafkreib5epjzumf3omr7rth5mtcsz4ugcoh3ut4d46hx5xhwm4b3pqr2vi';
    const content = { status: 'OK' };
    const key = `cache/${cacheKey(path)}`;

    afterEach(async () => {
      await remove(key);
    });

    describe('when the file is cached', () => {
      const cachedContent = { status: 'CACHED' };

      it('returns the cache file', async () => {
        await set(key, cachedContent);
        const response = await request(HOST).get(path);

        expect(response.body).toEqual(cachedContent);
        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
        expect(await get(key)).toEqual(cachedContent);
      });
    });

    describe('when the file is not cached', () => {
      it('returns the file and caches it', async () => {
        const response = await request(HOST).get(path);

        expect(response.body).toEqual(content);
        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
        expect(await get(key)).toEqual(response.body);
      });
    });
  });

  describe('when the IPFS cid does not exist', () => {
    it('returns a 400 error', async () => {
      const response = await request(HOST).get('/ipfs/test');

      expect(response.statusCode).toBe(400);
    });
  });
});
