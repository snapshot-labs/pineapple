import init, { client } from '@snapshot-labs/snapshot-metrics';
import type { Express } from 'express';
import gateways from './gateways.json';
import { providersMap, IMAGE_PROVIDERS, JSON_PROVIDERS } from './providers/utils';

let server;

export default function initMetrics(app: Express) {
  init(app, {
    normalizedPath: [['^/ipfs/.*', '/ipfs/#url']],
    whitelistedPath: [/^\/$/, /^\/upload$/, /^\/ipfs\/.*$/]
  });

  app.use((req, res, next) => {
    if (!server) {
      // @ts-ignore
      server = req.socket.server;
    }
    next();
  });
}

const gatewaysCount = new client.Gauge({
  name: 'ipfs_gateways_count',
  help: 'Number of IPFS gateways.'
});
gatewaysCount.set(gateways.length);

const providersJsonCount = new client.Gauge({
  name: 'providers_json_count',
  help: 'Number of providers used for JSON pinning.'
});
providersJsonCount.set(JSON_PROVIDERS.filter(p => providersMap[p].isConfigured()).length);

const providersImageCount = new client.Gauge({
  name: 'providers_image_count',
  help: 'Number of providers used for image pinning.'
});
providersImageCount.set(IMAGE_PROVIDERS.filter(p => providersMap[p].isConfigured()).length);

export const timeProvidersUpload = new client.Histogram({
  name: 'providers_upload_duration_seconds',
  help: "Duration in seconds of provider's upload requests.",
  labelNames: ['name'],
  buckets: [0.5, 1, 2, 5, 10, 15]
});

export const providersUploadSize = new client.Counter({
  name: 'providers_upload_size',
  help: "Total size of each provider's upload file.",
  labelNames: ['name']
});

const providersReturnCount = new client.Counter({
  name: 'providers_return_count',
  help: 'Number of times each provider have been used.',
  labelNames: ['name']
});

export const timeIpfsGatewaysResponse = new client.Histogram({
  name: 'ipfs_gateways_response_duration_seconds',
  help: "Duration in seconds of each IPFS gateway's reponse.",
  labelNames: ['name'],
  buckets: [0.5, 1, 2, 5, 10, 15]
});

export const ipfsGatewaysReturnCount = new client.Counter({
  name: 'ipfs_gateways_return_count',
  help: 'Number of times each gateway have been used.',
  labelNames: ['name']
});

export const countOpenProvidersRequest = new client.Gauge({
  name: 'providers_open_connections_count',
  help: 'Number of open connections to providers.',
  labelNames: ['name']
});

export const countOpenGatewaysRequest = new client.Gauge({
  name: 'ipfs_gateways_open_connections_count',
  help: 'Number of open connections to gateways.',
  labelNames: ['name']
});

export const providersInstrumentation = (req, res, next) => {
  const oldJson = res.json;
  res.json = body => {
    if (res.statusCode === 200 && body) {
      providersReturnCount.inc({ name: body.result?.provider || body.provider });
    }

    res.locals.body = body;
    return oldJson.call(res, body);
  };
  next();
};

new client.Gauge({
  name: 'express_open_connections_size',
  help: 'Number of open connections on the express server.',
  async collect() {
    if (server) {
      this.set(server._connections);
    }
  }
});
