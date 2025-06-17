import fs from 'fs';
import path from 'path';
import ipfsProviders from '../../../src/providers/ipfs';
import swarmProviders from '../../../src/providers/swarm';

const providers = {
  ...ipfsProviders,
  ...swarmProviders
};

const jsonProviders = [providers.fleek, providers.pinata, providers['4everland'], providers.swarmy];

const imageProviders = [providers.fleek, providers.pinata, providers['4everland']];

describe('providers', () => {
  jest.retryTimes(2);

  const json = {
    input: {
      status: 'OK'
    },
    output: {
      v0: 'QmTJzHxw4pPgcv6ZtA7hm9L32Evr2Z6A1LoEuTp9UGZC2n',
      v1: 'bafkreib5epjzumf3omr7rth5mtcsz4ugcoh3ut4d46hx5xhwm4b3pqr2vi',
      swarm: '2f897e39ca12b83795d167384f87da2b4bc4ebab70755bfa2933496a4e5cb5c7'
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
      name: p.id,
      provider: p,
      idVersion: version
    }));
  }

  const providerPayload: { name: string; provider: any; idVersion: string }[] =
    buildProviderPayload([providers.fleek, providers.pinata], 'v0')
      .concat(buildProviderPayload([providers['4everland']], 'v1'))
      .concat(buildProviderPayload([providers.swarmy], 'swarm'));

  describe.each(providerPayload)('$name', ({ name, provider, idVersion }) => {
    if (!provider.isConfigured()) {
      it.todo(`needs to set credentials for ${name}`);
    } else {
      const shouldTestJson = jsonProviders.includes(provider);
      const jsonTest = shouldTestJson ? it : it.skip;

      jsonTest(
        'should upload a JSON file',
        async () => {
          const result = await provider.set(json.input);

          expect(result.provider).toBe(name);
          expect(result.cid).toBe(json.output[idVersion]);
        },
        20e3
      );

      const shouldTestImage = imageProviders.includes(provider);
      const imageTest = shouldTestImage ? it : it.skip;

      imageTest(
        'should upload an image file',
        async () => {
          const buffer = await image.input;
          const result = await provider.set(buffer);

          expect(result.provider).toBe(name);
          expect(result.cid).toBe(image.output[idVersion]);
        },
        20e3
      );
    }
  });
});
