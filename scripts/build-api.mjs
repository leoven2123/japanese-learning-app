import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

await esbuild.build({
  entryPoints: [resolve(rootDir, 'api/index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: resolve(rootDir, 'api/index.js'),
  external: [
    // Keep node_modules external - Vercel will install them
    'express',
    '@trpc/server',
    'drizzle-orm',
    'postgres',
    'dotenv',
    'zod',
    'jose',
    'cookie',
    'nanoid',
    'axios',
    '@aws-sdk/client-s3',
    '@aws-sdk/s3-request-presigner',
  ],
  alias: {
    '@shared': resolve(rootDir, 'shared'),
    '@': resolve(rootDir, 'client/src'),
  },
  banner: {
    js: `
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`,
  },
});

console.log('API bundle built successfully!');
