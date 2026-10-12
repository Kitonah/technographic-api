import { Hono } from 'hono';

const app = new Hono();

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    runtime: 'cloudflare-workers',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (c) => {
  return c.text('B2B Technographic API Engine - Ready');
});

export default app;