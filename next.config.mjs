/** @type {import('next').NextConfig} */
const nextConfig = {
  optimizePackageImports: ['lucide-react', 'date-fns', 'recharts'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
    ],
  },
}

export default nextConfig
