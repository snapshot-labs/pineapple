import 'dotenv/config';
import { fallbackLogger, initLogger } from '@snapshot-labs/snapshot-sentry';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import initMetrics from './metrics';
import proxy from './proxy';
import rpc from './rpc';
import upload from './upload';
import { version } from '../package.json';

const app = express();
const PORT = process.env.PORT || 3000;

const commit = process.env.COMMIT_HASH || '';
const v = commit ? `${version}#${commit.substr(0, 7)}` : version;

initLogger(app);
initMetrics(app);

app.disable('x-powered-by');
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ limit: '4mb', extended: false }));
app.use(cors({ maxAge: 86400 }));
app.use(compression());
app.use('/', rpc);
app.use('/', upload);
app.use('/', proxy);
app.get('/', (req, res) => res.json({ version: v, port: PORT }));

fallbackLogger(app);

app.listen(PORT, () => console.log(`Listening at http://localhost:${PORT}`));
