import { capture } from '@snapshot-labs/snapshot-sentry';
import ipfsProviders, {
  IMAGE_PROVIDERS as IPFS_IMAGE_PROVIDERS,
  JSON_PROVIDERS as IPFS_JSON_PROVIDERS
} from './ipfs';
import swarmProviders, {
  IMAGE_PROVIDERS as SWARM_IMAGE_PROVIDERS,
  JSON_PROVIDERS as SWARM_JSON_PROVIDERS
} from './swarm';
import { Protocol, ProviderMap, UploadOptions } from './types';
import {
  countOpenProvidersRequest,
  providersUploadSize,
  timeProvidersUpload
} from '../helpers/metrics';
import { getDataSize } from '../helpers/utils';

export const PROVIDERS = {
  ipfs: {
    image: IPFS_IMAGE_PROVIDERS,
    json: IPFS_JSON_PROVIDERS,
    list: ipfsProviders as ProviderMap
  },
  swarm: {
    image: SWARM_IMAGE_PROVIDERS,
    json: SWARM_JSON_PROVIDERS,
    list: swarmProviders as ProviderMap
  }
} as const;

export const DEFAULT_PROTOCOL: Protocol = 'ipfs';

export default function uploadToProviders(
  options: UploadOptions
): Promise<{ cid: string; provider: string }> {
  const { protocol, type, params, customProviderIds } = options;
  const providerIds = customProviderIds || PROVIDERS[protocol][type];
  const configuredProviders = providerIds
    .map(p => PROVIDERS[protocol].list[p])
    .filter(p => p?.isConfigured());

  if (configuredProviders.length === 0) {
    throw new Error(`No configured providers available for ${protocol}/${type}`);
  }

  return Promise.any(
    configuredProviders.map(async ({ id, set }) => {
      const end = timeProvidersUpload.startTimer({ name: id, type, protocol });
      let status = 0;

      try {
        countOpenProvidersRequest.inc({ name: id, type, protocol });

        const result = await set(params);
        const size = getDataSize(params);
        providersUploadSize.inc({ name: id, type, protocol }, size);
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
        end({ status, protocol });
        countOpenProvidersRequest.dec({ name: id, type, protocol });
      }
    })
  );
}
