import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { NextConfig } from 'next'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  experimental: { externalDir: true },
  outputFileTracingRoot: path.resolve(dirname, '..'),
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '~': path.resolve(dirname, 'src'),
      '@': path.resolve(dirname, '../src'),
    }
    return config
  },
}

export default nextConfig
