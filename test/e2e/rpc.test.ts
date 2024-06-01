import fetch from 'node-fetch';
import { get, remove } from '../../src/aws';
import heavyPayload from './fixtures/too-heavy.json';
import { getRandomInt } from '../utils';

const HOST = `http://localhost:${process.env.PORT || 3003}`;

function post(body?) {
  return fetch(HOST, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
}

describe('POST /', () => {
  describe('when the payload is valid', () => {
    const fixture = { random: `${getRandomInt(1000)}.${getRandomInt(1000)}` };
    let response;
    let body;

    beforeAll(async () => {
      response = await post({ params: fixture });
      body = await response.json();
    });

    afterAll(async () => {
      await remove(body.result.cid);
    });

    it('returns a 200 error', async () => {
      expect(response.status).toBe(200);
    });

    it('returns the result with CID and provider name', () => {
      expect(body.result.cid.length).toBeGreaterThan(10);
      expect(['4everland', 'infura', 'fleek', 'pinata']).toContain(body.result.provider);
    });

    it('uploads the payload to the provider', async () => {
      const providerReponse = await fetch(
        `https://snapshot.4everland.link/ipfs/${body.result.cid}`
      );
      expect(await providerReponse.buffer()).toEqual(Buffer.from(JSON.stringify(fixture)));
    }, 10e3);

    it('caches the payload', async () => {
      expect(JSON.parse((await get(body.result.cid)) as string)).toEqual(fixture);
    });
  });

  describe('when the payload is not valid', () => {
    it('returns a 400 error on malformed json', async () => {
      const response = await post({ test: 'value' });

      expect(response.status).toBe(400);
      expect((await response.json()).error.message).toBe('Malformed body');
    });

    it('returns a 400 error on empty body', async () => {
      const response = await post();

      expect(response.status).toBe(400);
      expect((await response.json()).error.message).toBe('Malformed body');
    });

    it('return an error when the payload exceed 100kb', async () => {
      const response = await post({ params: heavyPayload });

      expect(response.status).toBe(400);
      expect((await response.json()).error.message).toBe('File too large');
    });
  });
});
