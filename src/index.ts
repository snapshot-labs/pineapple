import 'dotenv/config';
import express from 'express';
import { initLogger, fallbackLogger } from '@snapshot-labs/snapshot-sentry';
import cors from 'cors';
import rpc from './rpc';
import upload from './upload';
import proxy from './proxy';
import { version } from '../package.json';
import initMetrics from './metrics';

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
app.use('/', rpc);
app.use('/', upload);
app.use('/', proxy);
app.get('/', (req, res) => res.json({ version: v, port: PORT }));

fallbackLogger(app);

app.listen(PORT, () => console.log(`Listening at http://localhost:${PORT}`));
