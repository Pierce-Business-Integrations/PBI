/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.1.47"],
  images: {
    qualities: [75],
  },
  async redirects() {
    return [
      ...["piercewebsolutions.com", "www.piercewebsolutions.com"].map(
        (host) => ({
          source: "/:path*",
          has: [{ type: "host", value: host }],
          destination: "https://piercebusinessintegrations.com/:path*",
          permanent: true,
        }),
      ),
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.piercebusinessintegrations.com" }],
        destination: "https://piercebusinessintegrations.com/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/project-intake/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/api/intake/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
