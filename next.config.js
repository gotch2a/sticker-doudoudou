/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Commenté pour permettre les API routes
  images: {
    unoptimized: true
  },
  // Configuration pour PWA
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
