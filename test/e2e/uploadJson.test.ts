import request from 'supertest';

const HOST = `http://localhost:${process.env.PORT || 3003}`;

describe('POST /', () => {
  describe('when the payload is valid', () => {
    it('returns a 200 error', async () => {
      const response = await request(HOST)
        .post('/')
        .send({ params: { test: 'value' } });

      expect(response.statusCode).toBe(200);
      expect(response.body.result.cid.length).toBeGreaterThan(10);
      expect(['4everland', 'fleek', 'pinata']).toContain(response.body.result.provider);
    }, 20e3);
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
  });
});
