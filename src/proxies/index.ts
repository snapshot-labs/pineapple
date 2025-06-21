import ipfsProxies from './ipfs';
import swarmProxies from './swarm';
import { Protocol, ProxiesMap, ResolveOptions, Response } from './types';
import { withServiceMetrics } from '../decorators';

export const UNSUPPORTED_FILE_TYPE_ERROR = 'unsupported file type';

const PROXIES: Record<Protocol, ProxiesMap> = {
  ipfs: ipfsProxies,
  swarm: swarmProxies
};

function getConfiguredProxies(protocol: Protocol): Array<ReturnType<typeof withServiceMetrics>> {
  return Object.values(PROXIES[protocol]).map(proxy =>
    withServiceMetrics(proxy, 'resolve', {
      protocol,
      serviceType: 'proxy',
      operationType: 'resolve'
    })
  );
}

export function resolveFromProxies({ protocol, hash }: ResolveOptions): Promise<Response> {
  const configuredProxies = getConfiguredProxies(protocol);

  if (configuredProxies.length === 0) {
    throw new Error(`No configured proxies available for protocol: ${protocol}`);
  }

  return Promise.any(configuredProxies.map(proxy => proxy.resolve(hash)));
}
