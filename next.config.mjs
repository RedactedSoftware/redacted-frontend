/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://18.218.126.210:8082/:path*',
      },
    ]
  },
}

export default nextConfig;

