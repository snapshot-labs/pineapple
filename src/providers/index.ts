import { capture } from '@snapshot-labs/snapshot-sentry';
import ipfsProviders, {
  IMAGE_PROVIDERS as IPFS_IMAGE_PROVIDERS,
  JSON_PROVIDERS as IPFS_JSON_PROVIDERS
} from './ipfs';
import swarmProviders, {
  IMAGE_PROVIDERS as SWARM_IMAGE_PROVIDERS,
  JSON_PROVIDERS as SWARM_JSON_PROVIDERS
} from './swarm';
import { Protocol, ProviderMap, ProviderType, UploadOptions } from './types';
import { withServiceMetrics } from '../decorators';

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

function getConfiguredProviders(
  protocol: Protocol,
  type: ProviderType
): Array<ReturnType<typeof withServiceMetrics>> {
  return PROVIDERS[protocol][type]
    .map((id: string) => PROVIDERS[protocol].list[id])
    .filter(provider => provider?.isConfigured())
    .map(provider =>
      withServiceMetrics(provider, 'set', {
        protocol,
        serviceType: 'provider',
        operationType: type
      })
    );
}

export default function uploadToProviders({
  protocol,
  type,
  params
}: UploadOptions): Promise<{ cid: string; provider: string }> {
  const configuredProviders = getConfiguredProviders(protocol, type);

  if (configuredProviders.length === 0) {
    throw new Error(`No configured providers available for ${protocol}/${type}`);
  }

  return Promise.any(
    configuredProviders.map(async provider => {
      try {
        return await provider.set(params);
      } catch (e) {
        if (e instanceof Error) {
          if (e.message !== 'Request timed out') {
            capture(e, { name: provider.id });
          }
        } else {
          capture(new Error(`Error from ${provider.id} provider`), {
            contexts: { provider_response: e }
          });
        }
        return Promise.reject(e);
      }
    })
  );
}
