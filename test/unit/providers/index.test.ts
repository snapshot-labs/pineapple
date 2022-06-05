import { set as setFleek } from '../../../src/providers/fleek';
import { set as setInfura } from '../../../src/providers/infura';
import { set as setWeb3Storage } from '../../../src/providers/web3storage';

describe('providers', () => {
  const input = {
    status: 'OK'
  };

  const cid = {
    v0: 'QmTJzHxw4pPgcv6ZtA7hm9L32Evr2Z6A1LoEuTp9UGZC2n',
    v1: 'bafkreib5epjzumf3omr7rth5mtcsz4ugcoh3ut4d46hx5xhwm4b3pqr2vi'
  };

  describe.each([
    { name: 'fleek', set: setFleek, cid: cid.v0 },
    { name: 'infura', set: setInfura, cid: cid.v0 },
    { name: 'web3storage', set: setWeb3Storage, cid: cid.v1 }
  ])('$name', ({ name, set, cid }) => {
    it('should upload a file', async () => {
      const result = await set(input);

      expect(result.provider).toBe(name);
      expect(result.cid).toBe(cid);
    });
  });
});
