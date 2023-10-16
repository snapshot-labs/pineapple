import request from 'supertest';
import { get } from '../../src/aws';
import heavyPayload from './fixtures/too-heavy.json';

const HOST = `http://localhost:${process.env.PORT || 3003}`;

describe('POST /', () => {
  describe('when the payload is valid', () => {
    const content = { test: 'value' };
    let response;

    beforeAll(async () => {
      response = await request(HOST).post('/').send({ params: content });
    });

    it('returns a 200 error', async () => {
      expect(response.statusCode).toBe(200);
    });

    it('returns a payload', () => {
      expect(response.body.result.cid.length).toBeGreaterThan(10);
      expect(['4everland', 'infura', 'fleek', 'pinata']).toContain(response.body.result.provider);
    });

    it('caches the payload', async () => {
      expect(await get(response.body.result.cid)).toEqual(Buffer.from(JSON.stringify(content)));
    });
  });

  describe('when the payload is not valid', () => {
    it('returns a 400 error on malformed json', async () => {
      const response = await request(HOST).post('/').send({ test: 'value' });

      expect(response.statusCode).toBe(400);
      expect(response.body.error.message).toBe('Malformed body');
    });

    it('returns a 400 error on empty body', async () => {
      const response = await request(HOST).post('/');

      expect(response.statusCode).toBe(400);
      expect(response.body.error.message).toBe('Malformed body');
    });

    it('return an error when the payload exceed 100kb', async () => {
      const response = await request(HOST).post('/').send(heavyPayload);

      expect(response.statusCode).toBe(400);
      expect(response.body.error.message).toBe('File too large');
    });
  });
});
