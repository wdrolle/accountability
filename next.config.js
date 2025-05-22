const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'cdn.sanity.io',
      'fquqnvtknptzdycxyzug.supabase.co',
      'localhost',
      '3000-01jgesrqxqw7pr48rhr6s37tms.cloudspaces.litng.ai'
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3001',
        '3000-01jgesrqxqw7pr48rhr6s37tms.cloudspaces.litng.ai'
      ]
    },
    turbo: {
      rules: {
        // Add any specific Turbopack rules here if needed
      }
    }
  },
  webpack: (config, { isServer, webpack }) => {
    // Exclude agents-api directory from the build
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/agents-api/**', '**/node_modules/**']
    };

    // Add path alias resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };

    if (!isServer) {
      // Client-side configuration
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        dns: false,
        child_process: false,
        async_hooks: false
      };

      // Add plugins for browser polyfills
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer']
        })
      );
    }

    return config;
  },
  async rewrites() {
    return [];
  },
  serverRuntimeConfig: {
    port: 3001
  },
  distDir: '.next'
}

module.exports = nextConfig
