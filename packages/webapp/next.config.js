/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    externalDir: true,
    allowMiddlewareResponseBody: true,
  },
};

module.exports = nextConfig;
