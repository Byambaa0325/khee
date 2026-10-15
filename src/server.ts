import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { BASE_PATH, PORT } from './config.js';

const app = createApp();

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(JSON.stringify({ severity: 'INFO', message: `khee listening on :${info.port}${BASE_PATH}` }));
});
