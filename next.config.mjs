/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  optimizePackageImports: ['lucide-react', 'date-fns', 'recharts', '@radix-ui/react-toast', '@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-popover'],
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
