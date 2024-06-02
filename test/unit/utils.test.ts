import sharp from 'sharp';
import path from 'path';
import { processImage } from '../../src/utils';

describe('utils', () => {
  describe('processImage()', () => {
    const valid_image_path = path.join(__dirname, './providers/fixtures/sample.webp');
    const corrupted_image_path = path.join(__dirname, './providers/fixtures/corrupted.jpeg');

    it('returns a buffer', () => {
      expect(processImage(valid_image_path)).resolves.toBeInstanceOf(Buffer);
    });

    it('resizes the image to fit the max dimensions', async () => {
      const result = await processImage(valid_image_path);
      const metadata = await sharp(result).metadata();

      expect(metadata.width).toBe(1500);
      return expect(metadata.height).toBe(1004);
    });

    describe('on a corrupted image', () => {
      it('ignores errors and returns the image buffer', async () => {
        expect(processImage(corrupted_image_path)).resolves.toBeInstanceOf(Buffer);
      });
    });
  });
});
