const apiInternal = process.env.API_URL_INTERNAL || "http://localhost:8000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiInternal}/:path*`,
      },
    ];
  },
};

export default nextConfig;
