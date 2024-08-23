import fs from 'fs';
import path from 'path';
import * as FourEverland from '../../../src/providers/4everland';
import * as Fleek from '../../../src/providers/fleek';
import * as Pinata from '../../../src/providers/pinata';

describe('providers', () => {
  jest.retryTimes(2);

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

  function buildProviderPayload(providers, version) {
    return providers.map(p => ({
      name: p.provider,
      provider: p,
      idVersion: version
    }));
  }

  const providerPayload: { name: string; provider: any; idVersion: string }[] =
    buildProviderPayload([Fleek, Pinata], 'v0').concat(buildProviderPayload([FourEverland], 'v1'));

  describe.each(providerPayload)('$name', ({ name, provider, idVersion }) => {
    if (!provider.isConfigured()) {
      it.todo(`needs to set credentials for ${name}`);
    } else {
      it('should upload a JSON file', async () => {
        const result = await provider.set(json.input);

        expect(result.provider).toBe(name);
        expect(result.cid).toBe(json.output[idVersion]);
      }, 20e3);

      it('should upload an image file', async () => {
        const buffer = await image.input;
        const result = await provider.set(buffer);

        expect(result.provider).toBe(name);
        expect(result.cid).toBe(image.output[idVersion]);
      }, 20e3);
    }
  });
});
