/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enables standalone output mode for optimized, minimal Docker images
  output: 'standalone',
  
  experimental: {
    serverActions: {
      // Allows submitting larger forms (e.g., rich text doubts, test configurations)
      bodySizeLimit: '5mb',
    },
  },
  
  images: {
    // Allows optimization of remote images from Oracle Object Storage or other CDNs
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;