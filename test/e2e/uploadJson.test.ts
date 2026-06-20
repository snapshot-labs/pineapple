import request from 'supertest';
import { JSON_PROVIDERS as IPFS_JSON_PROVIDERS } from '../../src/providers/ipfs';
import { JSON_PROVIDERS as SWARM_JSON_PROVIDERS } from '../../src/providers/swarm';
import { createApp } from '../helpers/app';

const IPFS_JSON_PROVIDER_NAMES = IPFS_JSON_PROVIDERS.map(p => p.provider);
const SWARM_JSON_PROVIDER_NAMES = SWARM_JSON_PROVIDERS.map(p => p.provider);

const JSON_PROVIDER_NAMES = [
  ...IPFS_JSON_PROVIDER_NAMES,
  ...SWARM_JSON_PROVIDER_NAMES
];

// These suites upload to real, credential-gated providers (4everland for IPFS,
// Swarmy for Swarm). GitHub does not expose repo secrets to Dependabot PRs, so
// the env vars are empty there and the upload requests fail with HTTP 500.
// Guard the credential-dependent blocks so they are skipped (not failed) when
// the relevant creds are absent, while still running on master / normal PRs.
const hasIpfsCreds = Boolean(
  process.env.EVER_API_KEY && process.env.EVER_API_SECRET
);
const hasSwarmCreds = Boolean(process.env.SWARMY_API_KEY);

if (!hasIpfsCreds) {
  console.warn(
    'Skipping IPFS upload e2e: EVER_API_KEY / EVER_API_SECRET not set'
  );
}
if (!hasSwarmCreds) {
  console.warn('Skipping Swarm upload e2e: SWARMY_API_KEY not set');
}

describe('POST /', () => {
  let app: any;

  beforeAll(() => {
    app = createApp();
  });

  describe('ipfs protocol', () => {
    (hasIpfsCreds ? describe : describe.skip)(
      'when the payload is valid',
      () => {
        it('returns a 200 status', async () => {
          const response = await request(app)
            .post('/')
            .send({ params: { status: 'OK' } });

          expect(response.statusCode).toBe(200);
          expect(response.body.result).toHaveProperty(
            'cid',
            'bafkreib5epjzumf3omr7rth5mtcsz4ugcoh3ut4d46hx5xhwm4b3pqr2vi'
          );
          expect(JSON_PROVIDER_NAMES).toContain(response.body.result.provider);
        }, 20e3);

        it('returns a 200 when protocol is ipfs', async () => {
          const response = await request(app)
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
          expect(JSON_PROVIDER_NAMES).toContain(response.body.result.provider);
        }, 20e3);
      }
    );

    describe('when the payload is not valid', () => {
      it('returns a 400 error on malformed json', async () => {
        const response = await request(app).post('/').send({ test: 'value' });

        expect(response.statusCode).toBe(400);
        expect(response.body.error.message).toBe('Malformed body');
      });

      it('returns a 400 error on empty body', async () => {
        const response = await request(app).post('/');

        expect(response.statusCode).toBe(400);
        expect(response.body.error.message).toBe('Malformed body');
      });
    });
  });

  describe('swarm protocol', () => {
    (hasSwarmCreds ? describe : describe.skip)(
      'when the payload is valid',
      () => {
        it('returns a 200 status when protocol is swarm', async () => {
          const response = await request(app)
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
          expect(JSON_PROVIDER_NAMES).toContain(response.body.result.provider);
        }, 20e3);
      }
    );

    describe('when the payload is not valid', () => {
      it('returns a 400 error on malformed json', async () => {
        const response = await request(app).post('/').send({
          test: 'value',
          protocol: 'swarm'
        });

        expect(response.statusCode).toBe(400);
        expect(response.body.error.message).toBe('Malformed body');
      });

      it('returns a 400 error on empty body', async () => {
        const response = await request(app)
          .post('/')
          .send({ protocol: 'swarm' });

        expect(response.statusCode).toBe(400);
        expect(response.body.error.message).toBe('Malformed body');
      });
    });
  });
});
