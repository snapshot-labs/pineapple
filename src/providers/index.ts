import { capture } from '@snapshot-labs/snapshot-sentry';
import {
  IMAGE_PROVIDERS as IPFS_IMAGE_PROVIDERS,
  JSON_PROVIDERS as IPFS_JSON_PROVIDERS
} from './ipfs';
import {
  IMAGE_PROVIDERS as SWARM_IMAGE_PROVIDERS,
  JSON_PROVIDERS as SWARM_JSON_PROVIDERS
} from './swarm';
import {
  countOpenProvidersRequest,
  providersUploadSize,
  timeProvidersUpload
} from '../metrics';

type ProviderType = 'image' | 'json';
type Protocol = 'ipfs' | 'swarm';

const PROVIDERS = {
  ipfs: {
    image: IPFS_IMAGE_PROVIDERS,
    json: IPFS_JSON_PROVIDERS
  },
  swarm: {
    image: SWARM_IMAGE_PROVIDERS,
    json: SWARM_JSON_PROVIDERS
  }
} as const;

export const DEFAULT_PROTOCOL: Protocol = 'ipfs';

export default async function uploadToProviders(
  protocol: Protocol,
  type: ProviderType,
  params: any
) {
  if (!PROVIDERS[protocol]) {
    throw new Error(`Unsupported protocol: ${protocol}`);
  }

  if (!PROVIDERS[protocol][type]?.length) {
    throw new Error(
      `Unsupported provider type: ${type} for protocol: ${protocol}`
    );
  }

  const configuredProviders = PROVIDERS[protocol][type].filter(p =>
    p.isConfigured()
  );

  try {
    return await Promise.any(
      configuredProviders.map(async ({ provider: name, set }) => {
        const end = timeProvidersUpload.startTimer({ name, type });
        let status = 0;

        try {
          countOpenProvidersRequest.inc({ name, type });

          const result = await set(params);
          const size = (
            params instanceof Buffer
              ? params
              : Buffer.from(JSON.stringify(params))
          ).length;
          providersUploadSize.inc({ name, type }, size);
          status = 1;
          console.log(`JSON pinned: ${result.provider} - ${result.cid}`);

          return result;
        } catch (err: any) {
          if (err instanceof Error) {
            if (err.message !== 'Request timed out') {
              capture(err, { name });
            }
          } else {
            capture(new Error(`Error from ${name} provider`), {
              contexts: { provider_response: err }
            });
          }
          return Promise.reject(err);
        } finally {
          end({ status });
          countOpenProvidersRequest.dec({ name, type });
        }
      })
    );
  } catch (err: any) {
    if (err instanceof AggregateError) {
      if (configuredProviders.length === 1) {
        throw err.errors[0];
      }

      throw new Error(
        `Unable to upload ${type} to ${protocol}: all providers failed`
      );
    }
    throw err;
  }
}
