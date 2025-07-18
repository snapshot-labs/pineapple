import path from 'path';
import fetch from 'node-fetch';
import sharp from 'sharp';
import request from 'supertest';
import { IMAGE_PROVIDERS as IPFS_IMAGE_PROVIDERS } from '../../src/providers/ipfs';
import { MAX_IMAGE_DIMENSION } from '../../src/routes/upload';
import { createApp } from '../helpers/app';

// Helper function to validate CID format
const isValidCid = (cid: string): boolean => {
  // CIDv0 format: starts with 'Qm' and is 46 characters long (base58)
  const cidv0Pattern = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  // CIDv1 format: starts with 'bafk' and is 59 characters long (base32)
  const cidv1Pattern = /^bafk[a-z2-7]{55}$/;

  return cidv0Pattern.test(cid) || cidv1Pattern.test(cid);
};

const IMAGE_PROVIDER_NAMES = IPFS_IMAGE_PROVIDERS.map(p => p.provider);

describe('POST /upload', () => {
  let app: any;

  beforeAll(() => {
    app = createApp();
  });
  jest.retryTimes(2);
  describe('when the image exceeds the maximum file size', () => {
    it('should return a 400 error', async () => {
      const response = await request(app)
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
    ])('should return a 415 error on %s', async (_, filename) => {
      const response = await request(app)
        .post('/upload')
        .attach('file', path.join(__dirname, `./fixtures/${filename}`));

      expect(response.statusCode).toBe(415);
      expect(response.body.error.message).toBe('Unsupported file type');
    });
  });

  describe('when the file is missing', () => {
    it('should return a 400 error', async () => {
      const response = await request(app).post('/upload');

      expect(response.statusCode).toBe(400);
      expect(response.body.error.message).toBe('No file submitted');
    });
  });

  describe('when uploading image files', () => {
    const supportedFormats = [
      { format: 'PNG', filename: 'valid.png' },
      { format: 'JPEG', filename: 'valid.jpg' },
      { format: 'GIF', filename: 'valid.gif' },
      { format: 'WebP', filename: 'valid.webp' },
      { format: 'TIFF', filename: 'valid.tiff' }
    ];

    it.each(supportedFormats)(
      'should successfully upload and convert $format to WebP with valid CID',
      async ({ filename }) => {
        const response = await request(app)
          .post('/upload')
          .attach('file', path.join(__dirname, `./fixtures/${filename}`));

        // Step 1: Verify API response
        expect(response.statusCode).toBe(200);
        expect(response.body.jsonrpc).toBe('2.0');
        expect(isValidCid(response.body.result.cid)).toBe(true);
        expect(IMAGE_PROVIDER_NAMES).toContain(response.body.result.provider);

        // Step 2: Verify IPFS gateway retrieval
        const gatewayUrl = `https://snapshot.4everland.link/ipfs/${response.body.result.cid}`;
        const gatewayResponse = await fetch(gatewayUrl);

        expect(gatewayResponse.ok).toBe(true);
        expect(gatewayResponse.headers.get('content-type')).toMatch(/^image\//);

        // Step 3: Verify content format and processing
        const imageBuffer = await gatewayResponse.buffer();
        const originalMetadata = await sharp(
          path.join(__dirname, `./fixtures/${filename}`)
        ).metadata();
        const metadata = await sharp(imageBuffer).metadata();

        expect(metadata.format).toBe('webp');
        expect(metadata.width).toBe(originalMetadata.width);
        expect(metadata.height).toBe(originalMetadata.height);

        // Step 4: Visual verification with snapshot testing
        const pngBuffer = await sharp(imageBuffer).png().toBuffer();
        // @ts-expect-error - jest-image-snapshot types not properly configured
        expect(pngBuffer).toMatchImageSnapshot({
          customSnapshotIdentifier: `upload-${filename.replace(/\./g, '-')}-to-webp`,
          failureThreshold: 0.01,
          failureThresholdType: 'percent'
        });
      },
      30000
    );
  });

  describe('when uploading large images', () => {
    it('should resize large images to max dimension with correct CID', async () => {
      const response = await request(app)
        .post('/upload')
        .attach('file', path.join(__dirname, './fixtures/large-image.jpg'));

      // Step 1: Verify API response
      expect(response.statusCode).toBe(200);
      expect(response.body.jsonrpc).toBe('2.0');
      expect(isValidCid(response.body.result.cid)).toBe(true);
      expect(IMAGE_PROVIDER_NAMES).toContain(response.body.result.provider);

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
    }, 30000);
  });
});
