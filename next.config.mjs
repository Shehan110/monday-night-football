/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',   // 👈 this line is required
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig