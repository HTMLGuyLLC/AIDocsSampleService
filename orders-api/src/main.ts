import { createServer } from 'node:http';
import { createApp } from './app.ts';
import { log } from './lib/log.ts';

const port = Number(process.env.PORT ?? 3000);
const { handler } = createApp();

createServer(handler).listen(port, () => {
  log('info', 'orders-api listening', { port });
});
