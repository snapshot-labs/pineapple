import { timeProvidersUpload, providersUploadSize, countOpenProvidersRequest } from '../metrics';
import { providersMap } from './utils';

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
        const type = params instanceof Buffer ? 'image' : 'json';
        providersUploadSize.inc({ name, type }, size);

        return result;
      } finally {
        end();
        countOpenProvidersRequest.dec({ name });
      }
    })
  );
}
