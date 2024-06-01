import { capture } from '@snapshot-labs/snapshot-sentry';
import { timeProvidersUpload, providersUploadSize, countOpenProvidersRequest } from '../metrics';
import { providersMap } from './utils';

type ProviderType = 'image' | 'json';

export default function uploadToProviders(
  providers: string[],
  type: ProviderType,
  payload: string | Buffer
) {
  const configuredProviders = providers.filter(p => providersMap[p].isConfigured());

  return Promise.any(
    configuredProviders.map(async name => {
      const end = timeProvidersUpload.startTimer({ name, type });
      let status = 0;

      try {
        countOpenProvidersRequest.inc({ name, type });

        const result = await providersMap[name].set(payload);
        const size = (payload instanceof Buffer ? payload : Buffer.from(JSON.stringify(payload)))
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
