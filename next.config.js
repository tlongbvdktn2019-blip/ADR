/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  // Compress and optimize output
  compress: true,
  // Set default port to avoid conflicts
  experimental: {
    serverComponentsExternalPackages: ['@sparticuz/chromium', 'puppeteer-core', 'puppeteer'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      if (Array.isArray(config.externals)) {
        config.externals.push('@sparticuz/chromium', 'puppeteer-core', 'puppeteer');
      }
    }
    return config;
  },
  async redirects() {
    return []
  },
}

module.exports = nextConfig

