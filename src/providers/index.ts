import { capture } from '@snapshot-labs/snapshot-sentry';
import ipfsProviders, {
  IMAGE_PROVIDERS as IPFS_IMAGE_PROVIDERS,
  JSON_PROVIDERS as IPFS_JSON_PROVIDERS
} from './ipfs';
import { Protocol, ProviderMap, UploadOptions } from './types';
import {
  countOpenProvidersRequest,
  providersUploadSize,
  timeProvidersUpload
} from '../helpers/metrics';

const PROVIDERS = {
  ipfs: {
    image: IPFS_IMAGE_PROVIDERS,
    json: IPFS_JSON_PROVIDERS,
    list: ipfsProviders as ProviderMap
  }
};

export const DEFAULT_PROTOCOL: Protocol = 'ipfs';

export default function uploadToProviders(
  options: UploadOptions
): Promise<{ cid: string; provider: string }> {
  const { protocol, type, params, customProviderIds } = options;
  const providerIds = customProviderIds || PROVIDERS[protocol][type];
  const configuredProviders = providerIds
    .map(p => PROVIDERS[protocol].list[p])
    .filter(p => p?.isConfigured());

  return Promise.any(
    configuredProviders.map(async ({ id, set }) => {
      const end = timeProvidersUpload.startTimer({ name: id, type });
      let status = 0;

      try {
        countOpenProvidersRequest.inc({ name: id, type });

        const result = await set(params);
        const size = (params instanceof Buffer ? params : Buffer.from(JSON.stringify(params)))
          .length;
        providersUploadSize.inc({ name: id, type }, size);
        status = 1;

        return result;
      } catch (e: any) {
        if (e instanceof Error) {
          if (e.message !== 'Request timed out') {
            capture(e, { name: id });
          }
        } else {
          capture(new Error(`Error from ${id} provider`), {
            contexts: { provider_response: e }
          });
        }
        return Promise.reject(e);
      } finally {
        end({ status });
        countOpenProvidersRequest.dec({ name: id, type });
      }
    })
  );
}
