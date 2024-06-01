import path from 'path';
import fs from 'fs';
import request from 'supertest';
import sharp from 'sharp';
import fetch from 'node-fetch';
import { get } from '../../src/aws';
import { preProcessImage } from '../../src/utils';
import constants from '../../src/constants.json';
import { getRandomInt } from '../utils';

const HOST = `http://localhost:${process.env.PORT || 3003}`;

function randomImage() {
  return sharp({
    create: {
      width: getRandomInt(constants.image.maxWidth),
      height: getRandomInt(constants.image.maxHeight),
      channels: 4,
      background: {
        r: getRandomInt(255),
        g: getRandomInt(255),
        b: getRandomInt(255),
        alpha: getRandomInt(100) / 100
      }
    }
  }).png();
}

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
    const originalImagePath = path.join(__dirname, './fixtures/random-image.webp');
    let response;
    let body;
    let finalImageBuffer;

    beforeAll(async () => {
      await randomImage().toFile(originalImagePath);
      finalImageBuffer = await preProcessImage(await fs.createReadStream(originalImagePath));

      response = await request(HOST).post('/upload').attach('file', originalImagePath);
      body = response.body;
    }, 10e3);

    afterAll(async () => {
      await fs.rmSync(originalImagePath);
    });

    it('returns the correct HTTP response', () => {
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
    });

    it('returns a JSON-RPC response with the CID and its provider', async () => {
      expect(body.jsonrpc).toBe('2.0');
      expect(body.result.cid.length).toBeGreaterThan(10);
      expect(['4everland', 'infura', 'fleek', 'pinata']).toContain(body.result.provider);
    });

    it('uploads the processed image to the provider', async () => {
      const providerReponse = await fetch(
        `https://snapshot.4everland.link/ipfs/${body.result.cid}`
      );
      expect(await providerReponse.buffer()).toEqual(finalImageBuffer);
    }, 10e3);

    it('caches the processed image', async () => {
      expect(await get(body.result.cid)).toEqual(finalImageBuffer);
    });
  });
});
