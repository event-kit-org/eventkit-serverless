// Every path is rewritten here (vercel.json); Fastify does the routing.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildApp, type Config, loadConfig } from '@event-kit-org/eventkit-core';
import type { FastifyInstance } from 'fastify';

/**
 * One app per function instance, built on the first request and reused while
 * the instance stays warm (along with its one Prisma client). Nothing else
 * lives between requests: the core keeps no caches, timers or in-memory limits.
 */
let app: Promise<FastifyInstance> | undefined;

export function getApp(config?: Config): Promise<FastifyInstance> {
  app ??= buildApp({ config: config ?? loadConfig() }).then(async (built) => {
    await built.ready();
    return built;
  });
  return app;
}

/** Vercel Node.js function: hands the raw request to Fastify's router. */
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const fastify = await getApp();
  fastify.server.emit('request', req, res);
}
