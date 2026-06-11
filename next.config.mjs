/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static site → export to ./out for Firebase Hosting
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
