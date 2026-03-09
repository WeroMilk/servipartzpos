/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  async redirects() {
    return [
      { source: '/connect-softrestaurant', destination: '/set-store-name', permanent: true },
      { source: '/set-bar-name', destination: '/set-store-name', permanent: true },
      { source: '/bar', destination: '/inventario', permanent: true },
    ];
  },
  async rewrites() {
    return [{ source: '/favicon.ico', destination: '/icon.svg' }];
  },
  // CSP: unsafe-eval solo en login (/) para evitar error de eval; resto de páginas más estricto
  async headers() {
    const cspBase = [
      "default-src 'self'",
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "connect-src 'self' https:",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ];
    return [
      {
        source: "/",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              ...cspBase,
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            ].join("; "),
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              ...cspBase,
              "script-src 'self' 'unsafe-inline'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.devtool = 'source-map';
    }
    if (dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            styles: {
              name: 'styles',
              test: /\.(css|scss)$/,
              chunks: 'all',
              enforce: true,
            },
          },
        },
      };
    }
    return config;
  },
}

module.exports = nextConfig
