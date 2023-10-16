import path from 'path';
import fs from 'fs';
import request from 'supertest';
import { get } from '../../src/aws';

const HOST = `http://localhost:${process.env.PORT || 3003}`;

describe('POST /upload', () => {
  describe('when the image exceed the maximum file size', () => {
    it('returns a 400 error', async () => {
      const response = await request(HOST)
        .post('/upload')
        .attach('file', path.join(__dirname, './fixtures/too-heavy.jpg'));

      expect(response.statusCode).toBe(400);
      expect(response.body.error.message).toBe('File too large');
    });
  });

  describe('when the file is not an image', () => {
    it.each([
      ['non-image file extension', 'file.json'],
      ['non-image impersonating image extension', 'json-file.png']
    ])('returns a 415 error on %s', async (title, filename) => {
      const response = await request(HOST)
        .post('/upload')
        .attach('file', path.join(__dirname, `./fixtures/${filename}`));

      expect(response.statusCode).toBe(415);
      expect(response.body.error.message).toBe('Unsupported file type');
    });
  });

  describe('when the file is missing', () => {
    it('returns a 400 error', async () => {
      const response = await request(HOST).post('/upload');

      expect(response.statusCode).toBe(400);
      expect(response.body.error.message).toBe('No file submitted');
    });
  });

  describe('when the file is correct', () => {
    const imagePath = path.join(__dirname, './fixtures/valid.webp');
    let response;

    beforeAll(async () => {
      response = await request(HOST).post('/upload').attach('file', imagePath);
    }, 10e3);

    it('uploads the file and returns a JSON-RPC response with the CID and its provider', async () => {
      expect(response.statusCode).toBe(200);
      expect(response.body.jsonrpc).toBe('2.0');
      expect(response.body.result.cid.length).toBeGreaterThan(10);
      expect(['4everland', 'infura', 'fleek', 'pinata']).toContain(response.body.result.provider);
    });

    it('caches the payload', async () => {
      expect(await get(response.body.result.cid)).toEqual(await fs.promises.readFile(imagePath));
    });
  });
});
