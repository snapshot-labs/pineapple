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

export const timeProvidersUpload = new client.Histogram({
  name: 'providers_upload_duration_seconds',
  help: "Duration in seconds of provider's upload requests.",
  labelNames: ['name', 'type', 'status', 'protocol'],
  buckets: DURATION_BUCKETS
});

export const providersUploadSize = new client.Counter({
  name: 'providers_upload_size',
  help: "Total size of each provider's upload file.",
  labelNames: ['name', 'type', 'protocol']
});

const providersReturnCount = new client.Counter({
  name: 'providers_return_count',
  help: 'Number of times each provider have been used.',
  labelNames: ['name', 'type', 'protocol']
});

export const timeProxyResponse = new client.Histogram({
  name: 'proxy_response_duration_seconds',
  help: "Duration in seconds of each proxy's response.",
  labelNames: ['name', 'status', 'protocol'],
  buckets: DURATION_BUCKETS
});

export const proxyReturnCount = new client.Counter({
  name: 'proxy_return_count',
  help: 'Number of times each proxy have been used.',
  labelNames: ['name', 'protocol']
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

export const countOpenProvidersRequest = new client.Gauge({
  name: 'providers_open_connections_count',
  help: 'Number of open connections to providers.',
  labelNames: ['name', 'type', 'protocol']
});

export const countOpenProxyRequest = new client.Gauge({
  name: 'proxy_open_connections_count',
  help: 'Number of open connections to proxies.',
  labelNames: ['name', 'protocol']
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
      providersReturnCount.inc({ name: body.result?.provider || body.provider, type, protocol });
    }

    res.locals.body = body;
    return oldJson.call(res, body);
  };
  next();
};
