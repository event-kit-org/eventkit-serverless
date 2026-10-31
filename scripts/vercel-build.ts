/**
 * Vercel runs this before every build (`vercel-build` in package.json), so a
 * production deploy migrates first however it was started: the GitHub Actions
 * job or a `vercel --prod` from a laptop. Migrations run here, never inside a
 * function.
 *
 * Production only: preview and development builds skip it. A production build
 * without DIRECT_URL fails rather than shipping code ahead of its schema.
 */
import { spawnSync } from 'node:child_process';
import process from 'node:process';

if (process.env.VERCEL_ENV !== 'production') {
  console.log(`vercel-build: ${process.env.VERCEL_ENV ?? 'local'} build, no migrations`);
  process.exit(0);
}

if (!process.env.DIRECT_URL) {
  console.error(
    'vercel-build: DIRECT_URL is not set for Production in Vercel. ' +
      'Add it (Settings → Environment Variables, Production only) so the deploy can migrate.',
  );
  process.exit(1);
}

console.log('vercel-build: applying migrations (DIRECT_URL)');
const result = spawnSync('npm', ['run', 'migrate'], { stdio: 'inherit', env: process.env });
process.exit(result.status ?? 1);
