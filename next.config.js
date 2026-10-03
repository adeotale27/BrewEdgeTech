const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  serverExternalPackages: ['mongodb'],
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/', destination: '/site.html' },
        { source: '/admin', destination: '/admin/index.html' },
        { source: '/admin/', destination: '/admin/index.html' },
        { source: '/services/website-design', destination: '/services/website-design/index.html' },
        { source: '/services/website-design/', destination: '/services/website-design/index.html' },
        { source: '/services/custom-software', destination: '/services/custom-software/index.html' },
        { source: '/services/custom-software/', destination: '/services/custom-software/index.html' },
        { source: '/services/ai-automation', destination: '/services/ai-automation/index.html' },
        { source: '/services/ai-automation/', destination: '/services/ai-automation/index.html' },
        { source: '/services/seo-visibility', destination: '/services/seo-visibility/index.html' },
        { source: '/services/seo-visibility/', destination: '/services/seo-visibility/index.html' },
      ],
    };
  },
  webpack(config, { dev }) {
    if (dev) {
      config.watchOptions = { poll: 2000, aggregateTimeout: 300, ignored: ['**/node_modules'] };
    }
    return config;
  },
  onDemandEntries: { maxInactiveAge: 10000, pagesBufferLength: 2 },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: 'frame-ancestors *;' },
          { key: 'Access-Control-Allow-Origin', value: process.env.CORS_ORIGINS || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: '*' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
