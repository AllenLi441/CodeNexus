import type { NextConfig } from "next";

// Conservative security headers. These are deliberately the "low blast
// radius" set — they don't break Pyodide CDN loading, third-party fonts,
// or matplotlib. Full CSP `default-src` is a future batch (needs auditing
// inline styles + dynamic Pyodide script injection first).
const securityHeaders = [
  // Disallow rendering this app in an <iframe> on other origins.
  { key: 'X-Frame-Options', value: 'DENY' },
  // Browsers must respect declared MIME types — blocks sniffing attacks.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Hide internal paths from third-party referrers.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // We never need camera / mic / geolocation. Lock them down so a bug
  // can't accidentally request them.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
] as const

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ['127.0.0.1'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders.map((h) => ({ ...h })),
      },
    ]
  },
};

export default nextConfig;
