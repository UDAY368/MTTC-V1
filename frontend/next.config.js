/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // Backend API URL. In production set in .env.local or build env (e.g. Vercel).
    // Trailing slash is normalized in apiBaseUrl.ts.
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  },
  // Static assets in public/ served at root (e.g. public/assets/* → /assets/*)
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
