/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["bcryptjs", "@prisma/client", "prisma"],
  devIndicators: false,
  images: {
    remotePatterns: [
      // Google Drive / Docs previews
      { protocol: "https", hostname: "drive.google.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Cloudinary
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Generic HTTPS images (covers any URL an admin pastes in)
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
