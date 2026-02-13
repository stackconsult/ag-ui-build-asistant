/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/api/copilotkit',
        destination: 'http://localhost:8000/copilotkit',
      },
    ];
  },
};

module.exports = nextConfig;
