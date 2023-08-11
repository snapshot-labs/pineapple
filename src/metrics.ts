import init, { client } from '@snapshot-labs/snapshot-metrics';
import type { Express } from 'express';

export default function initMetrics(app: Express) {
  init(app, {
    normalizedPath: [['^/ipfs/.*', '/ipfs/#url']],
    whitelistedPath: [/^\/$/, /^\/upload$/, /^\/ipfs\/.*$/]
  });
}

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
