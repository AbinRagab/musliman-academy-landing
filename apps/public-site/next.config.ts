import path from 'node:path';
import type { NextConfig } from 'next';

const repositoryRoot = path.resolve(process.cwd(), '../..');

const nextConfig: NextConfig = {
  outputFileTracingRoot: repositoryRoot,
  turbopack: {
    root: repositoryRoot,
  },
  poweredByHeader: false,
  experimental: {
    // The root layout lives under app/[lang], so unmatched URLs need a
    // standalone 404 document.
    globalNotFound: true,
  },
};

export default nextConfig;
