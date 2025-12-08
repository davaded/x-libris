/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    webpack: (config) => {
        config.cache = false;
        return config;
    },
};

export default nextConfig;
