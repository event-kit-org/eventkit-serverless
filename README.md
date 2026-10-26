# eventkit-serverless

eventKit's API on Vercel serverless functions, in Mumbai (`bom1`). **The main
hosting target.** All the logic lives in [`eventkit-core`](../eventkit-core);
`api/index.ts` builds one app per warm function instance and hands each request
to it. `vercel.json` rewrites every path to that function.

## Install

`@crossbow2560/eventkit-core` is a private package on GitHub Packages:

```bash
export NODE_AUTH_TOKEN=<GitHub token with read:packages>
npm install
npm test        # smoke test: the handler routes into Fastify
```

## Deploy

Production deploys only from GitHub Actions on `main` (Vercel's own Git
deploys are off in `vercel.json`):

1. `npm run migrate`: migrations over `DIRECT_URL`, never inside a function
2. `vercel build --prod` and `vercel deploy --prebuilt --prod`

One-time setup:

1. Create the Vercel project (Node.js 24, region `bom1`, no framework) and link
   it once locally: `npx vercel link`. Note the org and project ids in
   `.vercel/project.json`.
2. In Vercel → Settings → Environment Variables (Production), set everything in
   `.env.example` except `DIRECT_URL`. Use `DATABASE_POOL_MAX=1`.
3. In GitHub → Settings → Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`,
   `VERCEL_PROJECT_ID`, `DIRECT_URL`. In the eventkit-core package settings
   (GitHub Packages), give this repo read access.
4. **Vercel Firewall:** add a rate-limit rule for `/v1/auth/*` (for example 30
   requests per minute per IP, then deny). This is eventKit's brute-force
   protection: the API keeps no in-memory limits.
5. Supabase in Mumbai too: [eventkit-core/docs/supabase.md](../eventkit-core/docs/supabase.md).

## Limits to watch

- Request bodies are capped near 4.5 MB: files go straight to R2, never here.
- `maxDuration` is 30 s. Urgent web push is sent within the request; if
  notifications to large audiences approach that, move push to a queue.
- After deploying, measure the scan endpoint on a test event:
  `npm run latency` (see `scripts/scan-latency.ts`) and record cold and warm
  times.
