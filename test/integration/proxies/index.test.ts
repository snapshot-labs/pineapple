import ipfsProxies from '../../../src/proxies/ipfs';
import swarmProxies from '../../../src/proxies/swarm';

const proxies = {
  ...ipfsProxies,
  ...swarmProxies
};

describe('proxies', () => {
  jest.retryTimes(2);

  // Test data from E2E tests
  const testCases = [
    {
      name: 'gateway',
      proxy: proxies.gateway,
      cid: 'bafkreib5epjzumf3omr7rth5mtcsz4ugcoh3ut4d46hx5xhwm4b3pqr2vi',
      content: { status: 'OK' },
      resolveMethod: (cid: string) => Promise.any(proxies.gateway.resolve(cid)),
      invalidInput: 'invalidcid',
      description: 'IPFS gateways'
    },
    {
      name: 'graph',
      proxy: proxies.graph,
      cid: 'QmPNovEZcmHT6yBd8BtzrELr1XrskrL3sMRGcV8PN3EfJX',
      content: {
        tree: [
          {
            address: '0x91FD2c8d24767db4Ece7069AA27832ffaf8590f3',
            votingPower: '1'
          }
        ]
      },
      resolveMethod: (cid: string) => proxies.graph.resolve(cid),
      invalidInput: 'invalidcid',
      description: 'The Graph IPFS node'
    },
    {
      name: 'ethswarm',
      proxy: proxies.ethswarm,
      cid: '2f897e39ca12b83795d167384f87da2b4bc4ebab70755bfa2933496a4e5cb5c7',
      content: { status: 'OK' },
      resolveMethod: (cid: string) => proxies.ethswarm.resolve(cid),
      invalidInput: 'invalidhash',
      description: 'Ethereum Swarm gateway'
    }
  ];

  describe.each(testCases)(
    '$name',
    ({ name, resolveMethod, cid, content, invalidInput, description }) => {
      it(`should resolve a valid CID/hash from ${description}`, async () => {
        const result = await resolveMethod(cid);

        expect(result.proxy).toBe(name);
        expect(result.json).toEqual(content);
      }, 30e3);

      it(`should reject invalid CID/hash`, async () => {
        await expect(resolveMethod(invalidInput)).rejects.toBeDefined();
      }, 30e3);
    }
  );
});
