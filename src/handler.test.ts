import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { loadConfig } from '@crossbow2560/eventkit-core';
import { afterAll, describe, expect, it } from 'vitest';
import handler, { getApp } from '../api/index.ts';

const config = loadConfig({
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  // Never connected to: the smoke test only calls routes that skip the database.
  DATABASE_URL: 'postgresql://unused:unused@127.0.0.1:1/unused',
  JWT_SECRET: 'smoke-test-secret-smoke-test-secret-00',
  PLATFORM_API_KEY: 'smoke-test-platform-key-smoke-test-00',
  R2_ACCOUNT_ID: 'unused',
  R2_BUCKET: 'unused',
  R2_ACCESS_KEY_ID: 'unused',
  R2_SECRET_ACCESS_KEY: 'unused',
});

describe('Vercel handler', async () => {
  const app = await getApp(config);
  // Serve the handler the way Vercel's runtime does: a plain Node request listener.
  const server = createServer((req, res) => void handler(req, res));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  afterAll(async () => {
    server.close();
    await app.close();
  });

  it('reuses one app across invocations', async () => {
    expect(await getApp()).toBe(app);
  });

  it('routes requests into Fastify', async () => {
    const health = await fetch(`${base}/health`);
    expect(await health.json()).toEqual({ status: 'ok' });
    const me = await fetch(`${base}/v1/auth/me`);
    expect(me.status).toBe(401);
    expect(((await me.json()) as { error: { code: string } }).error.code).toBe('API_KEY_REQUIRED');
  });
});
