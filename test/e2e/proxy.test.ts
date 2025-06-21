import request from 'supertest';
import { get, remove, set } from '../../src/helpers/aws';

const HOST = `http://localhost:${process.env.PORT || 3003}`;

describe('GET /ipfs/:cid', () => {
  describe('when the gateway IPFS cid exists', () => {
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

  describe('when the graph IPFS cid exists', () => {
    const cid = 'QmPNovEZcmHT6yBd8BtzrELr1XrskrL3sMRGcV8PN3EfJX';
    const path = `/ipfs/${cid}`;

    it('returns the file', async () => {
      const response = await request(HOST).get(path);

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
      expect(response.body).toMatchSnapshot();
    });
  });

  describe('when the IPFS cid does not exist', () => {
    it('returns a 400 error', async () => {
      const response = await request(HOST).get('/ipfs/test');

      expect(response.statusCode).toBe(400);
    }, 30e3);
  });
});

describe('GET /swarm/:cid', () => {
  describe('when the swarm cid exists', () => {
    const cid = '2f897e39ca12b83795d167384f87da2b4bc4ebab70755bfa2933496a4e5cb5c7';
    const path = `/swarm/${cid}`;
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

    it('returns the file from swarm gateway', async () => {
      const response = await request(HOST).get(path);

      expect(response.body).toEqual(content);
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
    }, 30e3);
  });

  describe('when the swarm cid does not exist', () => {
    it('returns a 400 error', async () => {
      const response = await request(HOST).get('/swarm/invalidhash');

      expect(response.statusCode).toBe(400);
    }, 30e3);
  });
});
