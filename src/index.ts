import 'dotenv/config';
import { capture, fallbackLogger, initLogger } from '@snapshot-labs/snapshot-sentry';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import initMetrics from './metrics';
import setupRoutes from './routes';

// Multipart parse errors are thrown synchronously from busboy's stream writer
// (see https://github.com/mscdex/busboy), which bypasses multer's error
// callback and Express's error middleware. Without a handler, a single
// malformed upload request would terminate the process. Log to Sentry and
// keep running for these known-recoverable cases; preserve default crash
// behavior for anything else.
const RECOVERABLE_UNCAUGHT_ERRORS = [
  'Malformed part header',
  'Unexpected end of form',
  'Unexpected end of multipart data'
];

process.on('uncaughtException', (err: Error) => {
  if (err?.message && RECOVERABLE_UNCAUGHT_ERRORS.some(m => err.message.includes(m))) {
    capture(err);
    return;
  }
  console.error('Uncaught exception:', err);
  process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 3000;

initLogger(app);
initMetrics(app);

app.disable('x-powered-by');
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '4mb', extended: false }));
app.use(cors({ maxAge: 86400 }));
app.use(compression());

setupRoutes(app);
fallbackLogger(app);

app.listen(PORT, () => console.log(`Listening at http://localhost:${PORT}`));
