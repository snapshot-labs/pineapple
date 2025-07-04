import fetch from 'node-fetch';
import request from 'supertest';
import { JSON_PROVIDERS as IPFS_JSON_PROVIDERS } from '../../src/providers/ipfs';
import { createApp } from '../helpers/app';

const JSON_PROVIDER_NAMES = IPFS_JSON_PROVIDERS.map(p => p.provider);

describe('POST / (JSON upload)', () => {
  let app: any;

  beforeAll(() => {
    app = createApp();
  });
  describe('when the payload is valid', () => {
    it('should successfully upload JSON and retrieve from IPFS with correct content', async () => {
      const originalPayload = { test: 'value' };
      const response = await request(app).post('/').send({ params: originalPayload });

      // Step 1: Verify API response
      expect(response.statusCode).toBe(200);
      expect(response.body.jsonrpc).toBe('2.0');
      expect(response.body.result.cid).toEqual(
        'bafkreihzrpqw5p5imhfttjq7v746kkzt6w6mc25wvzzookgse3oaocjzgi'
      );
      expect(JSON_PROVIDER_NAMES).toContain(response.body.result.provider);

      // Step 2: Verify IPFS gateway retrieval
      const gatewayUrl = `https://snapshot.4everland.link/ipfs/${response.body.result.cid}`;
      const gatewayResponse = await fetch(gatewayUrl);

      expect(gatewayResponse.ok).toBe(true);
      expect(gatewayResponse.headers.get('content-type')).toMatch(/^application\/json/);

      // Step 3: Verify content integrity
      const retrievedJson = await gatewayResponse.json();
      expect(retrievedJson).toEqual(originalPayload);
    });
  });

  describe('when the payload is not valid', () => {
    it('should return a 400 error on malformed JSON', async () => {
      const response = await request(app).post('/').send({ test: 'value' });

      expect(response.statusCode).toBe(400);
      expect(response.body.error.message).toBe('Malformed body');
    });

    it('should return a 400 error on empty body', async () => {
      const response = await request(app).post('/');

      expect(response.statusCode).toBe(400);
      expect(response.body.error.message).toBe('Malformed body');
    });
  });
});
