const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep local `next dev` out of production `.next` so live pm2 is not overwritten.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "/accountability",
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || "/accountability",
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
      'fbsnszkmtillujdcwnnq.supabase.co',
      'localhost',
      '3000-01jgesrqxqw7pr48rhr6s37tms.cloudspaces.litng.ai'
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3001',
        'amorolle.com',
        'www.amorolle.com',
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
  async redirects() {
    return [
      {
        source: "/",
        destination: "/journal",
        permanent: false,
      },
      {
        source: "/about-zoe",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/ai-services",
        destination: "/journal",
        permanent: false,
      },
      {
        source: "/date-accountability",
        destination: "/journal",
        permanent: false,
      },
      {
        source: "/date-accountability/:path*",
        destination: "/journal/:path*",
        permanent: false,
      },
      {
        source: "/prayer-guidance",
        destination: "/journal",
        permanent: false,
      },
      {
        source: "/journal/spiritual-guidance",
        destination: "/journal/journal",
        permanent: false,
      },
      {
        source: "/journal/daily-devotionals",
        destination: "/journal/journal",
        permanent: false,
      },
      {
        source: "/journal/generate-message",
        destination: "/ai/assistant",
        permanent: false,
      },
      {
        source: "/journal/demo",
        destination: "/journal",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/journal",
        destination: "/date-accountability",
      },
      {
        source: "/journal/:path*",
        destination: "/date-accountability/:path*",
      },
    ];
  },
  serverRuntimeConfig: {
    port: 3001
  },
  distDir: '.next'
}

module.exports = nextConfig
