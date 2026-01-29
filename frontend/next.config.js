/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  },
  // Ensure static assets in public/ are served correctly (e.g. /Asserts/*)
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
