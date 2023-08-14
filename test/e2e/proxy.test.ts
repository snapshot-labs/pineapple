import request from 'supertest';

const HOST = `http://localhost:${process.env.PORT || 3003}`;

describe('GET /ipfs/*', () => {
  describe('when the IPFS cid exists', () => {
    it('returns the JSON file', async () => {
      const response = await request(HOST).get(
        '/ipfs/bafkreib5epjzumf3omr7rth5mtcsz4ugcoh3ut4d46hx5xhwm4b3pqr2vi'
      );

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ status: 'OK' });
    });
  });

  describe('when the IPFS cid does not exist', () => {
    it('returns a 400 error', async () => {
      const response = await request(HOST).get('/ipfs/test');

      expect(response.statusCode).toBe(400);
    });
  });
});
