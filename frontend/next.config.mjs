/** @type {import('next').NextConfig} */
const apiProxyUrl = process.env.API_PROXY_URL ?? 'http://localhost:4001';

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**.unyxsolutions.com' },
    ],
  },
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiProxyUrl}/api/:path*` }];
  },
};

export default nextConfig;
