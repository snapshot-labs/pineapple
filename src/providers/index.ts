import { timeProvidersUpload, providersUploadSize, countOpenProvidersRequest } from '../metrics';
import { providersMap } from './utils';

export default function uploadToProviders(providers: string[], params: any) {
  return Promise.any(
    providers.map(async name => {
      const end = timeProvidersUpload.startTimer({ name });

      try {
        countOpenProvidersRequest.inc({ name });

        const result = await providersMap[name].set(params);
        const size = (params instanceof Buffer ? params : Buffer.from(JSON.stringify(params)))
          .length;
        providersUploadSize.inc({ name }, size);

        return result;
      } finally {
        end();
        countOpenProvidersRequest.dec({ name });
      }
    })
  );
}
