import { capture } from '@snapshot-labs/snapshot-sentry';
import { timeProvidersUpload, providersUploadSize, countOpenProvidersRequest } from '../metrics';
import { providersMap } from './utils';
type ProviderType = 'image' | 'json';

export default function uploadToProviders(providers: string[], type: ProviderType, params: any) {
  const configuredProviders = providers.filter(p => providersMap[p].isConfigured());

  return Promise.any(
    configuredProviders.map(async name => {
      const type: ProviderType = params instanceof Buffer ? 'image' : 'json';
      const end = timeProvidersUpload.startTimer({ name, type });
      let status = 0;

      try {
        countOpenProvidersRequest.inc({ name, type });

        const result = await providersMap[name].set(params);
        const size = (params instanceof Buffer ? params : Buffer.from(JSON.stringify(params)))
          .length;
        providersUploadSize.inc({ name, type }, size);
        status = 1;

        return result;
      } catch (e: any) {
        if (e instanceof Error) {
          capture(e, { name });
        } else {
          capture('Error from provider', { contexts: { input: { name }, provider_response: e } });
        }
        return Promise.reject(e);
      } finally {
        end({ status });
        countOpenProvidersRequest.dec({ name, type });
      }
    })
  );
}
