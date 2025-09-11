/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration production optimisée TAGADOU.FR
  
  // Optimisations de performance
  poweredByHeader: false,
  compress: true,
  
  // Images optimisées
  images: {
    domains: [
      // Supabase Storage
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('/rest/v1', '.supabase.co') || '',
      // Domaines supplémentaires
      'tagadou.fr',
      'www.tagadou.fr'
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 an
  },

  // Optimisation build
  swcMinify: true,
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
    // Optimisations mémoire
    craCompat: true,
    // Pre-compilation des modules
    optimizePackageImports: ['@supabase/supabase-js', 'framer-motion'],
  },

  // Configuration standalone pour Docker
  output: 'standalone',

  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
        ],
      },
      // Cache optimisé pour assets statiques
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache pour API
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300',
          },
        ],
      },
    ]
  },

  // Redirections automatiques
  async redirects() {
    return [
      // Redirection www vers domaine principal
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.tagadou.fr',
          },
        ],
        destination: 'https://tagadou.fr/:path*',
        permanent: true,
      },
    ]
  },

  // Gestion des rewrites pour SPA
  async rewrites() {
    return [
      // API routes
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },

  // Variables d'environnement publiques
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },

  // Optimisation webpack
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimisations production
    if (!dev) {
      // Compression Brotli
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.BUILD_ID': JSON.stringify(buildId),
        })
      );

      // Optimisation des chunks
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
            },
          },
        },
      };
    }

    return config;
  },

  // Configuration TypeScript stricte
  typescript: {
    ignoreBuildErrors: false,
  },

  // Configuration ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Optimisation des polyfills
  reactStrictMode: true,
  
  // Configuration des pages
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Tracing pour debugging production
  experimental: {
    ...nextConfig.experimental,
    instrumentationHook: true,
  },
};

module.exports = nextConfig;
