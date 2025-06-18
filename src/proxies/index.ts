import ipfsProxies from './ipfs';
import swarmProxies from './swarm';
import { Protocol, ProxiesMap, Response } from './types';
import { countOpenProxyRequest, proxyReturnCount, timeProxyResponse } from '../helpers/metrics';

export const UNSUPPORTED_FILE_TYPE_ERROR = 'unsupported file type';

const PROXIES: Record<Protocol, ProxiesMap> = {
  ipfs: ipfsProxies,
  swarm: swarmProxies
};

export function resolveFromProxies(protocol: Protocol, hash: string): Promise<Response> {
  const proxies = Object.values(PROXIES[protocol]);

  const allPromises = proxies.flatMap(proxy => {
    const resolveResult = proxy.resolve(hash);

    // Handle both single promise and array of promises
    const promises = Array.isArray(resolveResult) ? resolveResult : [resolveResult];

    return promises.map(async promise => {
      const end = timeProxyResponse.startTimer({ name: proxy.id, protocol });
      let status = 0;

      try {
        countOpenProxyRequest.inc({ name: proxy.id, protocol });

        const result = await promise;
        status = 1;

        proxyReturnCount.inc({ name: proxy.id, protocol });

        return result;
      } finally {
        end({ status, protocol });
        countOpenProxyRequest.dec({ name: proxy.id, protocol });
      }
    });
  });

  return Promise.any(allPromises);
}
