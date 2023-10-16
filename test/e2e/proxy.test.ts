import request from 'supertest';
import jsonFixture from './fixtures/json';
import imageFixture from './fixtures/image';
import { set, get, remove } from '../../src/aws';

const HOST = `http://localhost:${process.env.PORT || 3003}`;
const FIXTURES: [string, Record<string, any>][] = [
  ['json', jsonFixture],
  ['image', imageFixture]
];

describe('GET /ipfs/:cid', () => {
  describe('when the IPFS cid exists', () => {
    afterAll(async () => {
      await Promise.all([jsonFixture, imageFixture].map(({ cid }) => remove(cid)));
    });

    describe.each(FIXTURES)('when the %s file is cached', (fileType, fixture) => {
      if (process.env.AWS_REGION) {
        it('returns the cached file', async () => {
          const randomCid = 'randomcid';
          const content = await fixture.alternateContent;
          await set(randomCid, fileType === 'json' ? JSON.stringify(content) : content);
          const response = await request(HOST).get(`/ipfs/${randomCid}`);

          expect(response.statusCode).toBe(200);
          expect(response.headers['content-type']).toContain(fixture.contentType);

          expect(response.body).toEqual(await fixture.alternateContent);
        });
      } else {
        it.todo('needs to set AWS credentials to test the cache');
      }
    });

    describe.each(FIXTURES)('when the %s file is not cached', (fileType, fixture) => {
      if (process.env.AWS_REGION) {
        let response;

        beforeAll(async () => {
          response = await request(HOST).get(`/ipfs/${fixture.cid}`);
        }, 10e3);

        it('returns the file', async () => {
          expect(response.statusCode).toBe(200);
          expect(response.headers['content-type']).toContain(fixture.contentType);
          expect(response.body).toEqual(await fixture.content);
        });

        it('caches the file', async () => {
          const cachedContent = await get(fixture.cid);
          expect(fileType === 'json' ? JSON.parse(cachedContent as string) : cachedContent).toEqual(
            await fixture.content
          );
        });
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
