import request from 'supertest';
import { set, get, remove } from '../../src/aws';

const HOST = `http://localhost:${process.env.PORT || 3003}`;

describe('GET /ipfs/:cid', () => {
  describe('when the IPFS cid exists', () => {
    const cid = 'bafkreib5epjzumf3omr7rth5mtcsz4ugcoh3ut4d46hx5xhwm4b3pqr2vi';
    const path = `/ipfs/${cid}`;
    const content = { status: 'OK' };

    afterEach(async () => {
      await remove(cid);
    });

    describe('when the file is cached', () => {
      if (process.env.AWS_REGION) {
        const cachedContent = { status: 'CACHED' };

        it('returns the cache file', async () => {
          await set(cid, cachedContent);
          const response = await request(HOST).get(path);

          expect(response.body).toEqual(cachedContent);
          expect(response.statusCode).toBe(200);
          expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
          expect(await get(cid)).toEqual(cachedContent);
        });
      } else {
        it.todo('needs to set AWS credentials to test the cache');
      }
    });

    describe('when the file is not cached', () => {
      if (process.env.AWS_REGION) {
        it('returns the file and caches it', async () => {
          const response = await request(HOST).get(path);

          expect(response.body).toEqual(content);
          expect(response.statusCode).toBe(200);
          expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
          expect(await get(cid)).toEqual(response.body);
        });
      } else {
        it.todo('needs to set AWS credentials to test the cache');
      }
    });

    it('returns a 415 error when not a JSON file', async () => {
      const response = await request(HOST).get(
        '/ipfs/bafybeie2x4ptheqskiauhfz4w4pbq7o6742oupitganczhjanvffp2spti'
      );

      expect(response.statusCode).toBe(415);
    }, 30e3);
  });

  describe('when the IPFS cid does not exist', () => {
    it('returns a 400 error', async () => {
      const response = await request(HOST).get('/ipfs/test');

      console.log(response.body);
      expect(response.statusCode).toBe(400);
    }, 30e3);
  });
});
