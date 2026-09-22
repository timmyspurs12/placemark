/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/demo/publisher',
        destination: '/api/demo-publisher',
      },
    ];
  },
};

module.exports = nextConfig;
