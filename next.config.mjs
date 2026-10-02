/** @type {import('next').NextConfig} */
const publicHost = "piercebusinessintegrations.com";
const clientHost = "client.piercebusinessintegrations.com";
const workspacePaths = [
  "/portal/:path*",
  "/account/:path*",
  "/sign-in/:path*",
  "/sign-up/:path*",
];

const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.1.47"],
  images: {
    qualities: [75],
  },
  async redirects() {
    return [
      ...workspacePaths.flatMap((source) =>
        [
          publicHost,
          `www.${publicHost}`,
          "piercewebsolutions.com",
          "www.piercewebsolutions.com",
        ].map((host) => ({
          source,
          has: [{ type: "host", value: host }],
          destination: `https://${clientHost}${source}`,
          permanent: true,
        })),
      ),
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
      {
        source: "/",
        has: [{ type: "host", value: clientHost }],
        destination: "/portal",
        permanent: false,
      },
      ...[
        "/clients",
        "/contact",
        "/about",
        "/pricing",
        "/services/:path*",
        "/project-intake/:path*",
        "/thank-you",
        "/privacy",
        "/terms",
      ].map((source) => ({
        source,
        has: [{ type: "host", value: clientHost }],
        destination: `https://${publicHost}${source}`,
        permanent: true,
      })),
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
      {
        source: "/portal/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/api/portal/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      ...["/account/:path*", "/sign-in/:path*", "/sign-up/:path*"].map(
        (source) => ({
          source,
          headers: [
            { key: "Cache-Control", value: "private, no-store" },
            { key: "Referrer-Policy", value: "no-referrer" },
            { key: "X-Robots-Tag", value: "noindex, nofollow" },
          ],
        }),
      ),
    ];
  },
};

export default nextConfig;
