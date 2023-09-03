import { timeProvidersUpload, providersUploadSize, countOpenProvidersRequest } from '../metrics';
import * as fleek from './fleek';
import * as infura from './infura';
import * as pinata from './pinata';
import * as web3storage from './web3storage';
import * as fourEverland from './4everland';
import { capture } from '@snapshot-labs/snapshot-sentry';

// List of providers used for pinning images
export const IMAGE_PROVIDERS = ['fleek', 'infura', 'pinata', '4everland'];
// List of providers used for pinning json
export const JSON_PROVIDERS = ['fleek', 'infura', 'web3storage', '4everland'];
const providersMap = {
  fleek,
  infura,
  pinata,
  web3storage,
  '4everland': fourEverland
};

export default function uploadToProviders(providers: string[], params: any) {
  const configuredProviders = providers.filter(p => providersMap[p].isConfigured());

  return Promise.any(
    configuredProviders.map(async name => {
      const end = timeProvidersUpload.startTimer({ name });

      try {
        countOpenProvidersRequest.inc({ name });

        const result = await providersMap[name].set(params);
        const size = (params instanceof Buffer ? params : Buffer.from(JSON.stringify(params)))
          .length;
        providersUploadSize.inc({ name }, size);

        return result;
      } catch (e: any) {
        capture(e);
        throw e;
      } finally {
        end();
        countOpenProvidersRequest.dec({ name });
      }
    })
  );
}
