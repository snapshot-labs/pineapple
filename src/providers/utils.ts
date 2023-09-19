import * as fleek from './fleek';
import * as infura from './infura';
import * as pinata from './pinata';
import * as web3storage from './web3storage';
import * as fourEverland from './4everland';

// List of providers used for pinning images
export const IMAGE_PROVIDERS = ['fleek', 'infura', 'pinata', '4everland'];

// List of providers used for pinning json
export const JSON_PROVIDERS = ['fleek', 'infura', 'web3storage', '4everland'];

export const providersMap = {
  fleek,
  infura,
  pinata,
  web3storage,
  '4everland': fourEverland
};
