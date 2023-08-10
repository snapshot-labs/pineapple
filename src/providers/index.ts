import * as fleek from './fleek';
import * as infura from './infura';
import * as pinata from './pinata';
import * as web3Storage from './web3storage';
import * as fourEverland from './4everland';
import { timeProvidersUpload } from '../metrics';

// List of providers used for pinning images
export const IMAGE_PROVIDERS = ['fleek', 'infura', 'pinata', '4everland'];
// List of providers used for pinning json
export const JSON_PROVIDERS = ['fleek', 'infura', 'web3storage', '4everland'];
const providersMap = {
  fleek,
  infura,
  pinata,
  web3Storage,
  '4everland': fourEverland
};

export default function set(providers: string[], params?: any) {
  return providers.map(async name => {
    const end = timeProvidersUpload.startTimer({ name });
    const result = await providersMap[name].set(params);
    end();

    return result;
  });
}
