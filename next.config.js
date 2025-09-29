/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  // Compress and optimize output
  compress: true,
  // Set default port to avoid conflicts
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Increase function timeout for PDF generation
  async headers() {
    return [
      {
        source: '/api/reports/:id*/export-pdf',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },
  async redirects() {
    return []
  },
}

module.exports = nextConfig

