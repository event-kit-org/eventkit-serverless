import { defineConfig } from 'vitest/config';

// The business rules are tested in eventkit-core. This is a smoke test of the
// entry point: the server starts from configuration and answers.
export default defineConfig({ test: { include: ['src/**/*.test.ts'] } });
