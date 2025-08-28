/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['images.unsplash.com', 'via.placeholder.com'],
  },
  env: {
    NEXT_PUBLIC_ADSENSE_PUBLISHER_ID: process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    }
    
    // Handle canvas and other browser-only modules
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push('canvas')
    }
    
    return config
  },
}

export default nextConfig