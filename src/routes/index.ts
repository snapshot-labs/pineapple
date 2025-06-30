import { Express } from 'express';
import proxy from './proxy';
import rpc from './rpc';
import upload from './upload';
import { version } from '../../package.json';

export default function setupRoutes(app: Express): void {
  const PORT = process.env.PORT || 3000;
  const commit = process.env.COMMIT_HASH || '';
  const v = commit ? `${version}#${commit.substr(0, 7)}` : version;

  app.use('/', rpc);
  app.use('/', upload);
  app.use('/', proxy);
  app.get('/', (req, res) => res.json({ version: v, port: PORT }));
}
