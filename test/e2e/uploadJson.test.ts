import request from 'supertest';

const HOST = `http://localhost:${process.env.PORT || 3003}`;

describe('POST /', () => {
  describe('ipfs protocol', () => {
    describe('when the payload is valid', () => {
      it('returns a 200 status', async () => {
        const response = await request(HOST)
          .post('/')
          .send({ params: { status: 'OK' } });

        expect(response.statusCode).toBe(200);
        expect(response.body.result).toHaveProperty(
          'cid',
          'bafkreib5epjzumf3omr7rth5mtcsz4ugcoh3ut4d46hx5xhwm4b3pqr2vi'
        );
        expect(response.body.result).toHaveProperty('provider', '4everland');
      }, 20e3);

      it('returns a 200 when protocol is ipfs', async () => {
        const response = await request(HOST)
          .post('/')
          .send({
            params: { status: 'OK' },
            protocol: 'ipfs'
          });

        expect(response.statusCode).toBe(200);
        expect(response.body.result).toHaveProperty(
          'cid',
          'bafkreib5epjzumf3omr7rth5mtcsz4ugcoh3ut4d46hx5xhwm4b3pqr2vi'
        );
        expect(response.body.result).toHaveProperty('provider', '4everland');
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

  describe('swarm protocol', () => {
    describe('when the payload is valid', () => {
      it('returns a 200 status when protocol is swarm', async () => {
        const response = await request(HOST)
          .post('/')
          .send({
            params: { status: 'OK' },
            protocol: 'swarm'
          });

        expect(response.statusCode).toBe(200);
        expect(response.body.result).toHaveProperty(
          'cid',
          '2f897e39ca12b83795d167384f87da2b4bc4ebab70755bfa2933496a4e5cb5c7'
        );
        expect(response.body.result).toHaveProperty('provider', 'swarmy');
      }, 20e3);
    });

    describe('when the payload is not valid', () => {
      it('returns a 400 error on malformed json', async () => {
        const response = await request(HOST).post('/').send({
          test: 'value',
          protocol: 'swarm'
        });

        expect(response.statusCode).toBe(400);
        expect(response.body.error.message).toBe('Malformed body');
      });

      it('returns a 400 error on empty body', async () => {
        const response = await request(HOST).post('/').send({ protocol: 'swarm' });

        expect(response.statusCode).toBe(400);
        expect(response.body.error.message).toBe('Malformed body');
      });
    });
  });
});
