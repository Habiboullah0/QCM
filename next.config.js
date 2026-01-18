const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 🔴 REQUIRED: next-pwa uses webpack
  experimental: {
    turbo: false,
  },
};

module.exports = withPWA(nextConfig);
