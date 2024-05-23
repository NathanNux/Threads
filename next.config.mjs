/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // serverActions: true, // remove this line if it's not needed
    serverComponentsExternalPackages: ["mongoose"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
      {
        protocol: "https",
        hostname: "uploadthing.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // the remote patterns are the sources from where we can accept images, we can add more sources here and must be there
  // nextjs will accept images from these sources and not will blocking the sources to protect us from the xss attacks
};

  // this is there because we need to accept and show images within the app from these sources, we will not use database of our own, we will use the database of the clerk, so we need to accept images from these sources


export default nextConfig;