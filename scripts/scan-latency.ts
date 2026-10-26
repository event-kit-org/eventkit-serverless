/**
 * Measures the scan endpoint's cold and warm response times on a deployment.
 *
 *   API_URL=https://<deployment> API_KEY=<platform or event key> TOKEN=<volunteer JWT> \
 *   EVENT_ID=<id> CHECKPOINT_ID=<id> QR_TOKEN=<a participant's code> npm run latency
 *
 * The first request after a quiet period hits a cold instance; the rest are warm.
 * Each scan uses a fresh id, so these are real (mostly duplicate-rejected) scans:
 * run it against a test event.
 */
import { randomUUID } from 'node:crypto';

const need = (name: string) => {
  const v = process.env[name];
  if (!v) throw new Error(`Set ${name}`);
  return v;
};
const [url, key, token, eventId, checkpointId, qrToken] = [
  'API_URL',
  'API_KEY',
  'TOKEN',
  'EVENT_ID',
  'CHECKPOINT_ID',
  'QR_TOKEN',
].map(need) as [string, string, string, string, string, string];

async function scan(): Promise<number> {
  const started = performance.now();
  const res = await fetch(`${url}/v1/events/${eventId}/scans`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'x-api-key': key,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ id: randomUUID(), checkpointId, qrToken }),
  });
  await res.text();
  if (!res.ok) throw new Error(`scan failed: ${res.status}`);
  return performance.now() - started;
}

const cold = await scan();
const warm: number[] = [];
for (let i = 0; i < 20; i++) warm.push(await scan());
warm.sort((a, b) => a - b);
const pct = (p: number) => warm[Math.min(warm.length - 1, Math.floor((p / 100) * warm.length))]!;
console.log(`first request: ${cold.toFixed(0)} ms (cold if the function was idle)`);
console.log(
  `warm: p50 ${pct(50).toFixed(0)} ms, p95 ${pct(95).toFixed(0)} ms, max ${warm.at(-1)!.toFixed(0)} ms`,
);
