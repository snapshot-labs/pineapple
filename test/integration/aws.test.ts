import { randomUUID } from 'crypto';
import { set, get, remove } from '../../src/aws';

const KEY_PREFIX = `test-${randomUUID()}`;

describe('aws', () => {
  describe('set()', () => {
    const data = { foo: 'test-set' };

    it('should set a value', async () => {
      expect(set(`${KEY_PREFIX}-set`, data)).resolves.toBeTruthy();

      await new Promise(resolve => {
        setTimeout(resolve, 3e3);
      });

      expect(get(`${KEY_PREFIX}-set`)).resolves.toEqual(data);
    });
  });

  describe('get()', () => {
    const data = { foo: 'test-get' };

    beforeAll(async () => {
      await set(`${KEY_PREFIX}-get`, data);
    });

    describe('when the key exist', () => {
      it('should return the value', async () => {
        expect(get(`${KEY_PREFIX}-get`)).resolves.toEqual(data);
      });
    });

    describe('when the key does not exist', () => {
      it('should return false', async () => {
        expect(get(`${KEY_PREFIX}-get-no-exist`)).resolves.toBe(false);
      });
    });
  });

  describe('remove()', () => {
    const data = { foo: `${KEY_PREFIX}-remove` };

    beforeAll(async () => {
      await set(`${KEY_PREFIX}-remove`, data);
    });

    describe('when the file exist', () => {
      it('should remove a value', async () => {
        expect(remove(`${KEY_PREFIX}-remove`)).resolves.toBeTruthy();
      });
    });

    describe('when the file does not exist', () => {
      it('should return false', async () => {
        expect(remove(`${KEY_PREFIX}-remove-no-exist`)).resolves;
      });
    });
  });
});
