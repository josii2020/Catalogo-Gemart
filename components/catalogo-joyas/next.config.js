/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.dropboxusercontent.com",
      },
    ],
  },
  // Revalidar cada 60 segundos para mantener sincronizado con Dropbox
  experimental: {},
};

module.exports = nextConfig;
