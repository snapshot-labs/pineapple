import * as fourEverland from './4everland';
import * as fleek from './fleek';
import * as infura from './infura';
import * as pinata from './pinata';
import * as web3storage from './web3storage';

export const IMAGE_PROVIDERS = [fleek, infura, pinata, fourEverland];
export const JSON_PROVIDERS = [fleek, infura, web3storage, fourEverland];
