import express from 'express';
import setupRoutes from '../../src/routes';

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '4mb', extended: false }));

  setupRoutes(app);

  return app;
}
