/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["bcryptjs", "@prisma/client", "prisma"],
  devIndicators: false,
};

export default nextConfig;
