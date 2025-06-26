import path from 'path';
import fetch from 'node-fetch';
import sharp from 'sharp';
import request from 'supertest';
import { IMAGE_PROVIDERS } from '../../src/providers/utils';
import { MAX_IMAGE_DIMENSION } from '../../src/upload';

const HOST = `http://localhost:${process.env.PORT || 3003}`;

describe('POST /upload', () => {
  describe('when the image exceeds the maximum file size', () => {
    it('should return a 400 error', async () => {
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
    ])('should return a 415 error on %s', async (title, filename) => {
      const response = await request(HOST)
        .post('/upload')
        .attach('file', path.join(__dirname, `./fixtures/${filename}`));

      expect(response.statusCode).toBe(415);
      expect(response.body.error.message).toBe('Unsupported file type');
    });
  });

  describe('when the file is missing', () => {
    it('should return a 400 error', async () => {
      const response = await request(HOST).post('/upload');

      expect(response.statusCode).toBe(400);
      expect(response.body.error.message).toBe('No file submitted');
    });
  });

  describe('when uploading image files', () => {
    const supportedFormats = [
      {
        format: 'PNG',
        filename: 'valid.png',
        expectedCid: 'bafkreibrjgzmmw3xrlxmvrwggdezy4wkl5lr4l4ynejsa2e5ofpnk3tdcq'
      },
      {
        format: 'JPEG',
        filename: 'valid.jpg',
        expectedCid: 'bafkreici7ui6grsxxta6ntb5bzrxp2nvecitsryhh43cssxmdqenqdmo3q'
      },
      {
        format: 'GIF',
        filename: 'valid.gif',
        expectedCid: 'bafkreig5l27dexl4ze7kxuiyeh7msl6u2hn7cjftohpyviqgc4fvg7cxta'
      },
      {
        format: 'WebP',
        filename: 'valid.webp',
        expectedCid: 'bafkreifl35jxvvab43gdb2qshzmwyjdyticmpmldck2abhva3zbw5n56qa'
      },
      {
        format: 'TIFF',
        filename: 'valid.tiff',
        expectedCid: 'bafkreieecxi4bm62eodunwiljgfeogvxejqi3i2comwtqhjllqul5ylw6m'
      }
    ];

    it.each(supportedFormats)(
      'should successfully upload and convert $format to WebP with correct CID',
      async ({ filename, expectedCid }) => {
        const response = await request(HOST)
          .post('/upload')
          .attach('file', path.join(__dirname, `./fixtures/${filename}`));

        // Step 1: Verify API response
        expect(response.statusCode).toBe(200);
        expect(response.body.jsonrpc).toBe('2.0');
        expect(response.body.result.cid).toBe(expectedCid);
        expect(IMAGE_PROVIDERS).toContain(response.body.result.provider);

        // Step 2: Verify IPFS gateway retrieval
        const gatewayUrl = `https://snapshot.4everland.link/ipfs/${response.body.result.cid}`;
        const gatewayResponse = await fetch(gatewayUrl);

        expect(gatewayResponse.ok).toBe(true);
        expect(gatewayResponse.headers.get('content-type')).toMatch(/^image\//);

        // Step 3: Verify content format and processing
        const imageBuffer = await gatewayResponse.buffer();
        const metadata = await sharp(imageBuffer).metadata();

        expect(metadata.format).toBe('webp');

        // Step 4: Visual verification with snapshot testing
        const pngBuffer = await sharp(imageBuffer).png().toBuffer();
        // @ts-expect-error - jest-image-snapshot types not properly configured
        expect(pngBuffer).toMatchImageSnapshot({
          customSnapshotIdentifier: `upload-${filename.replace(/\./g, '-')}-to-webp`,
          failureThreshold: 0.01,
          failureThresholdType: 'percent'
        });
      }
    );

    it('should return a 415 error for unsupported BMP format', async () => {
      const response = await request(HOST)
        .post('/upload')
        .attach('file', path.join(__dirname, './fixtures/valid.bmp'));

      expect(response.statusCode).toBe(415);
      expect(response.body.error.message).toBe('Unsupported file type');
    });
  });

  describe('when uploading large images', () => {
    it('should resize large images to max dimension with correct CID', async () => {
      const response = await request(HOST)
        .post('/upload')
        .attach('file', path.join(__dirname, './fixtures/large-image.jpg'));

      // Step 1: Verify API response
      expect(response.statusCode).toBe(200);
      expect(response.body.jsonrpc).toBe('2.0');
      expect(response.body.result.cid).toBe(
        'bafkreiegauglzj7nltxzlrhbzxw3qtbf6ronnporsikcxuk6ikns5rny34'
      );
      expect(IMAGE_PROVIDERS).toContain(response.body.result.provider);

      // Step 2: Verify IPFS gateway retrieval
      const gatewayUrl = `https://snapshot.4everland.link/ipfs/${response.body.result.cid}`;
      const gatewayResponse = await fetch(gatewayUrl);

      expect(gatewayResponse.ok).toBe(true);
      expect(gatewayResponse.headers.get('content-type')).toMatch(/^image\//);

      // Step 3: Verify content format and resize processing
      const imageBuffer = await gatewayResponse.buffer();
      const metadata = await sharp(imageBuffer).metadata();

      expect(metadata.format).toBe('webp');
      expect(metadata.width).toBeLessThanOrEqual(MAX_IMAGE_DIMENSION);
      expect(metadata.height).toBeLessThanOrEqual(MAX_IMAGE_DIMENSION);

      // Step 4: Visual verification with snapshot testing
      const pngBuffer = await sharp(imageBuffer).png().toBuffer();
      // @ts-expect-error - jest-image-snapshot types not properly configured
      expect(pngBuffer).toMatchImageSnapshot({
        customSnapshotIdentifier: 'large-image-resized-to-webp',
        failureThreshold: 0.01,
        failureThresholdType: 'percent'
      });
    });
  });
});
