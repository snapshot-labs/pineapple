import fetch from 'node-fetch';
import jsonFixture from './fixtures/json';
import imageFixture from './fixtures/image';
import { set, get, remove } from '../../src/aws';

const HOST = `http://localhost:${process.env.PORT || 3003}`;
const FIXTURES: [string, Record<string, any>][] = [
  ['json', jsonFixture],
  ['image', imageFixture]
];

async function normalizeContent(content: Promise<any>, fileType: string) {
  return fileType === 'json' ? Buffer.from(JSON.stringify(await content)) : await content;
}

describe('GET /ipfs/:cid', () => {
  describe('when the IPFS cid exists', () => {
    afterAll(async () => {
      await Promise.all([jsonFixture, imageFixture].map(({ cid }) => remove(cid)));
    });

    describe.each(FIXTURES)('when the %s file is cached', (fileType, fixture) => {
      if (process.env.AWS_REGION) {
        let response;

        beforeAll(async () => {
          const randomCid = 'randomcid';
          const content = await fixture.alternateContent;
          await set(randomCid, fileType === 'json' ? JSON.stringify(content) : content);
          response = await fetch(`${HOST}/ipfs/${randomCid}`);
        });

        it('returns the correct HTTP response', () => {
          expect(response.status).toBe(200);
          expect(response.headers.get('content-type')).toContain(fixture.contentType);
        });

        it('returns the cached file', async () => {
          expect(await response.buffer()).toEqual(
            await normalizeContent(fixture.alternateContent, fileType)
          );
        });
      } else {
        it.todo('needs to set AWS credentials to test the cache');
      }
    });

    describe.each(FIXTURES)('when the %s file is not cached', (fileType, fixture) => {
      if (process.env.AWS_REGION) {
        let response;

        beforeAll(async () => {
          response = await fetch(`${HOST}/ipfs/${fixture.cid}`);
        });

        it('returns the correct HTTP response', () => {
          expect(response.status).toBe(200);
          expect(response.headers.get('content-type')).toContain(fixture.contentType);
        });

        it('returns the file', async () => {
          expect(await response.buffer()).toEqual(
            await normalizeContent(fixture.content, fileType)
          );
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
      const response = await fetch(`${HOST}/ipfs/test`);

      expect(response.status).toBe(400);
    }, 30e3);
  });
});
