import request from 'supertest';
import heavyPayload from './fixtures/too-heavy.json';

const HOST = `http://localhost:${process.env.PORT || 3003}`;

describe('POST /', () => {
  describe('when the payload is valid', () => {
    it('returns a 200 error', async () => {
      const response = await request(HOST)
        .post('/')
        .send({ params: { test: 'value' } });

      expect(response.statusCode).toBe(200);
      expect(response.body.result.cid.length).toBeGreaterThan(10);
      expect(['4everland', 'infura', 'fleek', 'pinata']).toContain(response.body.result.provider);
    });
  });

  describe('when the payload is no valid', () => {
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
