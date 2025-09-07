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
  // Headers de sécurité avec support PayPal
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.paypal.com *.paypalobjects.com",
              "style-src 'self' 'unsafe-inline' *.paypal.com *.paypalobjects.com",
              "img-src 'self' data: blob: *.paypal.com *.paypalobjects.com",
              "font-src 'self' data: *.paypal.com *.paypalobjects.com",
              "connect-src 'self' *.paypal.com *.paypalobjects.com api.sandbox.paypal.com api-m.sandbox.paypal.com",
              "frame-src 'self' *.paypal.com *.paypalobjects.com",
              "child-src 'self' *.paypal.com *.paypalobjects.com",
              "object-src 'none'",
              "base-uri 'self'"
            ].join('; ')
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
