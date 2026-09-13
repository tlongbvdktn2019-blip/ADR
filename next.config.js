/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  // Compress and optimize output
  compress: true,
  // Set default port to avoid conflicts
  experimental: {
    serverComponentsExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  },
  async redirects() {
    return []
  },
}

module.exports = nextConfig
