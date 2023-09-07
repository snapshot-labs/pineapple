import request from 'supertest';

const HOST = `http://localhost:${process.env.PORT || 3003}`;

describe('GET /ipfs/*', () => {
  describe('when the IPFS cid exists', () => {
    it('returns a JSON file', async () => {
      const response = await request(HOST).get(
        '/ipfs/bafkreib5epjzumf3omr7rth5mtcsz4ugcoh3ut4d46hx5xhwm4b3pqr2vi'
      );

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ status: 'OK' });
    });

    it('returns a 400 error when not a JSON file', async () => {
      const response = await request(HOST).get(
        '/ipfs/bafybeie2x4ptheqskiauhfz4w4pbq7o6742oupitganczhjanvffp2spti'
      );

      expect(response.statusCode).toBe(400);
    }, 15e3);
  });

  describe('when the IPFS cid does not exist', () => {
    it('returns a 400 error', async () => {
      const response = await request(HOST).get('/ipfs/test');

      expect(response.statusCode).toBe(400);
    });
  });
});
