import path from 'path';
import fs from 'fs';
import request from 'supertest';
import fetch from 'node-fetch';
import { get } from '../../src/aws';

const HOST = `http://localhost:${process.env.PORT || 3003}`;

describe('POST /upload', () => {
  describe('when the payload is not valid', () => {
    it('returns a 400 error when payload exceed 1MB', async () => {
      const response = await request(HOST)
        .post('/upload')
        .attach('file', path.join(__dirname, './fixtures/too-heavy.jpg'));

      expect(response.statusCode).toBe(400);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body.error.message).toBe('File too large');
    });

    it.each([
      ['non-image file extension', 'file.json'],
      ['non-image impersonating image extension', 'json-file.png']
    ])('returns a 415 error on %s', async (title, filename) => {
      const response = await request(HOST)
        .post('/upload')
        .attach('file', path.join(__dirname, `./fixtures/${filename}`));

      expect(response.statusCode).toBe(415);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body.error.message).toBe('Unsupported file type');
    });

    it('returns a 400 error when the file is missing', async () => {
      const response = await request(HOST).post('/upload');

      expect(response.statusCode).toBe(400);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body.error.message).toBe('No file submitted');
    });
  });

  describe('when the payload is correct', () => {
    const imagePath = path.join(__dirname, './fixtures/valid.webp');
    let response;
    let body;

    beforeAll(async () => {
      response = await request(HOST).post('/upload').attach('file', imagePath);
      body = response.body;
    }, 10e3);

    it('returns the correct HTTP response', () => {
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
    });

    it('returns a JSON-RPC response with the CID and its provider', async () => {
      expect(body.jsonrpc).toBe('2.0');
      expect(body.result.cid.length).toBeGreaterThan(10);
      expect(['4everland', 'infura', 'fleek', 'pinata']).toContain(body.result.provider);
    });

    it('uploads the image to the provider', async () => {
      const providerReponse = await fetch(`https://cloudflare-ipfs.com/ipfs/${body.result.cid}`);
      expect(await providerReponse.buffer()).toEqual(await fs.promises.readFile(imagePath));
    });

    it('caches the payload', async () => {
      expect(await get(body.result.cid)).toEqual(await fs.promises.readFile(imagePath));
    });
  });
});
