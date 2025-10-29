import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  
  experimental: {
    serverComponentsExternalPackages: ['@solana/web3.js', '@solana/spl-token', '@metaplex-foundation/mpl-token-metadata'],
  },
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve('buffer'),
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    // Optimize bundle size for Vercel
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          solana: {
            test: /[\\/]node_modules[\\/](@solana|@metaplex-foundation)[\\/]/,
            name: 'solana',
            chunks: 'all',
            priority: 10,
          },
        },
      },
    };
    
    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'imgs.search.brave.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.phantom.app',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'solana-launchpad-assets.s3.ap-south-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.brandfetch.io',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;