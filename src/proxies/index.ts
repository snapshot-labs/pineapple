import ipfsProxies from './ipfs';
import { Protocol, ProxiesMap, Response } from './types';
import { countOpenProxyRequest, proxyReturnCount, timeProxyResponse } from '../helpers/metrics';

export const UNSUPPORTED_FILE_TYPE_ERROR = 'unsupported file type';

const PROXIES: Record<Protocol, ProxiesMap> = {
  ipfs: ipfsProxies
};

export function resolveFromProxies(protocol: Protocol, hash: string): Promise<Response> {
  const proxies = Object.values(PROXIES[protocol]);

  const allPromises = proxies.flatMap(proxy => {
    const resolveResult = proxy.resolve(hash);

    // Handle both single promise and array of promises
    const promises = Array.isArray(resolveResult) ? resolveResult : [resolveResult];

    return promises.map(async promise => {
      const end = timeProxyResponse.startTimer({ name: proxy.id });
      let status = 0;

      try {
        countOpenProxyRequest.inc({ name: proxy.id });

        const result = await promise;
        status = 1;

        proxyReturnCount.inc({ name: proxy.id });

        return result;
      } finally {
        end({ status });
        countOpenProxyRequest.dec({ name: proxy.id });
      }
    });
  });

  return Promise.any(allPromises);
}
