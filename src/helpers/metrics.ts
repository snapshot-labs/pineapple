import init, { client } from '@snapshot-labs/snapshot-metrics';
import { capture } from '@snapshot-labs/snapshot-sentry';
import { Express } from 'express';
import { PROVIDERS } from '../providers/';

const DURATION_BUCKETS = [0.5, 1, 2, 5, 10, 15];

export default function initMetrics(app: Express) {
  init(app, {
    normalizedPath: [
      ['^/ipfs/.*', '/ipfs/#url'],
      ['^/swarm/.*', '/swarm/#url']
    ],
    whitelistedPath: [/^\/$/, /^\/upload$/, /^\/(ipfs|swarm)\/.*$/],
    errorHandler: capture
  });

  app.use(providersInstrumentation);
}

const providersJsonCount = new client.Gauge({
  name: 'providers_json_count',
  help: 'Number of providers used for JSON pinning.',
  labelNames: ['protocol']
});

const providersImageCount = new client.Gauge({
  name: 'providers_image_count',
  help: 'Number of providers used for image pinning.',
  labelNames: ['protocol']
});

// Set provider counts for all protocols
Object.entries(PROVIDERS).forEach(([protocol, config]) => {
  providersJsonCount.set(
    { protocol },
    config.json.filter(p => config.list[p]?.isConfigured?.()).length
  );
  providersImageCount.set(
    { protocol },
    config.image.filter(p => config.list[p]?.isConfigured?.()).length
  );
});

export const serviceDuration = new client.Histogram({
  name: 'service_duration_seconds',
  help: 'Duration in seconds of service requests (providers/proxies).',
  labelNames: ['name', 'service_type', 'operation_type', 'status', 'protocol'],
  buckets: DURATION_BUCKETS
});

export const serviceOpenConnections = new client.Gauge({
  name: 'service_open_connections_count',
  help: 'Number of open connections to services (providers/proxies).',
  labelNames: ['name', 'service_type', 'operation_type', 'protocol']
});

export const serviceSize = new client.Counter({
  name: 'service_size_bytes',
  help: 'Total size of data processed by services (providers/proxies).',
  labelNames: ['name', 'service_type', 'operation_type', 'protocol']
});

export const serviceReturnCount = new client.Counter({
  name: 'service_return_count',
  help: 'Number of times each service (provider/proxy) has been used.',
  labelNames: ['name', 'service_type', 'operation_type', 'protocol']
});

export const proxyCacheHitCount = new client.Counter({
  name: 'proxy_cache_hit_count',
  help: 'Number of hit/miss of the proxy cache layer',
  labelNames: ['status', 'protocol']
});

export const proxyCacheSize = new client.Counter({
  name: 'proxy_cache_size',
  help: 'Total size going through the proxy cache layer',
  labelNames: ['status', 'protocol']
});

const providersInstrumentation = (req: any, res: any, next: any) => {
  let type: string | undefined;
  if (req.method === 'POST' && req.originalUrl === '/') {
    type = 'json';
  } else if (req.method === 'POST' && req.originalUrl === '/upload') {
    type = 'image';
  }

  if (!type) {
    return next();
  }

  const oldJson = res.json;
  res.json = (body: any) => {
    if (res.statusCode === 200 && body) {
      const protocol = req.body?.protocol || 'ipfs';
      serviceReturnCount.inc({
        name: body.result?.provider || body.provider,
        service_type: 'provider',
        operation_type: type,
        protocol
      });
    }

    res.locals.body = body;
    return oldJson.call(res, body);
  };
  next();
};
