import init, { client } from '@snapshot-labs/snapshot-metrics';
import type { Express } from 'express';
import gateways from './gateways.json';

export default function initMetrics(app: Express) {
  init(app, {
    normalizedPath: [['^/ipfs/.*', '/ipfs/#url']],
    whitelistedPath: [/^\/$/, /^\/upload$/, /^\/ipfs\/.*$/]
  });
}

const gatewaysCount = new client.Gauge({
  name: 'ipfs_gateways_count',
  help: 'Number of IPFS gateways'
});
gatewaysCount.set(gateways.length);

export const timeProvidersUpload = new client.Histogram({
  name: 'providers_upload_duration_seconds',
  help: "Duration in seconds of provider's upload requests",
  labelNames: ['name'],
  buckets: [0.5, 1, 2, 5, 10, 15]
});

export const providersUploadSize = new client.Counter({
  name: 'providers_upload_size',
  help: "Total size of each provider's upload file",
  labelNames: ['name']
});

export const timeIpfsGatewaysResponse = new client.Histogram({
  name: 'ipfs_gateways_response_duration_seconds',
  help: "Duration in seconds of each IPFS gateway's reponse",
  labelNames: ['name'],
  buckets: [0.5, 1, 2, 5, 10, 15]
});

export const ipfsGatewaysReturnCount = new client.Counter({
  name: 'ipfs_gateways_return_count',
  help: 'Number of times each gateway have been used',
  labelNames: ['name']
});
