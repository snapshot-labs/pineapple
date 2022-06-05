import fs from 'fs';
import path from 'path';
import { set as setFleek } from '../../../src/providers/fleek';
import { set as setInfura } from '../../../src/providers/infura';
import { set as setPinata } from '../../../src/providers/pinata';
import { set as setWeb3Storage } from '../../../src/providers/web3storage';

describe('providers', () => {
  const json = {
    input: {
      status: 'OK'
    },
    output: {
      v0: 'QmTJzHxw4pPgcv6ZtA7hm9L32Evr2Z6A1LoEuTp9UGZC2n',
      v1: 'bafkreib5epjzumf3omr7rth5mtcsz4ugcoh3ut4d46hx5xhwm4b3pqr2vi'
    }
  };

  const image = {
    input: fs.promises.readFile(path.join(__dirname, './fixtures/sample.webp')),
    output: {
      v0: 'QmY4XQ2qvrRwEZWr918BCjbW35Q7WJ7rsYZsDB1f8fhk7K',
      v1: 'bafkreickll7k76ciher5vfsly6ew6awqfa7ix74zww4pqkrrvyzbjwvr2a'
    }
  };

  describe.each([
    { name: 'fleek', set: setFleek, idVersion: 'v0' },
    { name: 'infura', set: setInfura, idVersion: 'v0' },
    { name: 'pinata', set: setPinata, idVersion: 'v0' },
    { name: 'web3storage', set: setWeb3Storage, idVersion: 'v1' }
  ])('$name', ({ name, set, idVersion }) => {
    it('should upload a JSON file', async () => {
      const result = await set(json.input);

      expect(result.provider).toBe(name);
      expect(result.cid).toBe(json.output[idVersion]);
    }, 10000);

    it('should upload an image file', async () => {
      const buffer = await image.input;
      const result = await set(buffer);

      expect(result.provider).toBe(name);
      expect(result.cid).toBe(image.output[idVersion]);
    }, 10000);
  });
});
