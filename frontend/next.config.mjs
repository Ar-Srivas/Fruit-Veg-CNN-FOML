/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.spoonacular.com',
      },
      {
        protocol: 'https',
        hostname: 'api.foml.arijitsrivastava.tech',
      },
    ],
  },
};

export default nextConfig;
