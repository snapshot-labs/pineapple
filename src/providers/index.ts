import { capture } from '@snapshot-labs/snapshot-sentry';
import {
  IMAGE_PROVIDERS as IPFS_IMAGE_PROVIDERS,
  JSON_PROVIDERS as IPFS_JSON_PROVIDERS
} from './ipfs';
import { countOpenProvidersRequest, providersUploadSize, timeProvidersUpload } from '../metrics';

type ProviderType = 'image' | 'json';
type Protocol = 'ipfs';

const PROVIDERS = {
  ipfs: {
    image: IPFS_IMAGE_PROVIDERS,
    json: IPFS_JSON_PROVIDERS
  }
};

export default function uploadToProviders(protocol: Protocol, type: ProviderType, params: any) {
  const configuredProviders = PROVIDERS[protocol][type].filter(p => p.isConfigured());

  return Promise.any(
    configuredProviders.map(async ({ provider: name, set }) => {
      const end = timeProvidersUpload.startTimer({ name, type });
      let status = 0;

      try {
        countOpenProvidersRequest.inc({ name, type });

        const result = await set(params);
        const size = (params instanceof Buffer ? params : Buffer.from(JSON.stringify(params)))
          .length;
        providersUploadSize.inc({ name, type }, size);
        status = 1;
        console.log(`JSON pinned: ${result.provider} - ${result.cid}`);

        return result;
      } catch (e: any) {
        if (e instanceof Error) {
          if (e.message !== 'Request timed out') {
            capture(e, { name });
          }
        } else {
          capture(new Error(`Error from ${name} provider`), {
            contexts: { provider_response: e }
          });
        }
        return Promise.reject(e);
      } finally {
        end({ status });
        countOpenProvidersRequest.dec({ name, type });
      }
    })
  );
}
