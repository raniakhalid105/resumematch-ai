/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow PDF uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig
