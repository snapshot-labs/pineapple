import request from 'supertest';
import { get, remove, set } from '../../src/aws';
import { createApp } from '../helpers/app';

describe('GET /ipfs/:cid', () => {
  let app: any;

  beforeAll(() => {
    app = createApp();
  });
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

        it('should return the cached file', async () => {
          await set(cid, cachedContent);
          const response = await request(app).get(path);

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
        it('should return the file and cache it', async () => {
          const response = await request(app).get(path);

          expect(response.body).toEqual(content);
          expect(response.statusCode).toBe(200);
          expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
          expect(await get(cid)).toEqual(response.body);
        });
      } else {
        it.todo('needs to set AWS credentials to test the cache');
      }
    });

    it('should return a 415 error when not a JSON file', async () => {
      const response = await request(app).get(
        '/ipfs/bafybeie2x4ptheqskiauhfz4w4pbq7o6742oupitganczhjanvffp2spti'
      );

      expect(response.statusCode).toBe(415);
    }, 30e3);
  });

  describe('when the IPFS cid does not exist', () => {
    it('should return a 400 error', async () => {
      const response = await request(app).get('/ipfs/test');

      expect(response.statusCode).toBe(400);
    }, 30e3);
  });
});
