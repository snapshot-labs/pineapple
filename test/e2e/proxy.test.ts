import request from 'supertest';
import jsonFixture from './fixtures/json';
import imageFixture from './fixtures/image';
import { set, get, remove } from '../../src/aws';

const HOST = `http://localhost:${process.env.PORT || 3003}`;
const FIXTURES: [string, Record<string, any>][] = [
  ['json', jsonFixture],
  ['image', imageFixture]
];

function normalizeResponse(output: Buffer, fileType: string): JSON | Buffer {
  return fileType === 'json' ? JSON.parse(output.toString()) : output;
}

describe('GET /ipfs/:cid', () => {
  describe('when the IPFS cid exists', () => {
    afterEach(async () => {
      await Promise.all([jsonFixture, imageFixture].map(({ cid }) => remove(cid)));
    });

    describe.each(FIXTURES)('when the %s file is cached', (fileType, fixture) => {
      if (process.env.AWS_REGION) {
        it('returns the cached file', async () => {
          const randomCid = 'randomcid';
          await set(randomCid, await fixture.alternateContent);
          const response = await request(HOST).get(`/ipfs/${randomCid}`);

          expect(response.statusCode).toBe(200);
          expect(response.headers['content-type']).toContain(fixture.contentType);
          expect(response.body).toEqual(
            normalizeResponse(await fixture.alternateContent, fileType)
          );
        });
      } else {
        it.todo('needs to set AWS credentials to test the cache');
      }
    });

    describe.each(FIXTURES)('when the %s file is not cached', (fileType, fixture) => {
      if (process.env.AWS_REGION) {
        it('returns the file and caches it', async () => {
          const response = await request(HOST).get(`/ipfs/${fixture.cid}`);

          expect(response.statusCode).toBe(200);
          expect(response.headers['content-type']).toContain(fixture.contentType);
          expect(response.body).toEqual(normalizeResponse(await fixture.content, fileType));
          expect(normalizeResponse(await get(fixture.cid), fileType)).toEqual(
            normalizeResponse(await fixture.content, fileType)
          );
        }, 10e3);
      } else {
        it.todo('needs to set AWS credentials to test the cache');
      }
    });
  });

  describe('when the IPFS cid does not exist', () => {
    it('returns a 400 error', async () => {
      const response = await request(HOST).get('/ipfs/test');

      expect(response.statusCode).toBe(400);
    }, 30e3);
  });
});
