/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Previene clickjacking (iframes maliciosos)
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // Previene MIME type sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Habilita protección XSS del navegador
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  // Controla información del referrer
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Permissions Policy — restringe APIs del navegador
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
  },
  // Strict Transport Security (HSTS) — fuerza HTTPS por 1 año
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  // Content Security Policy — protección contra XSS e inyección de scripts
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https: http:",
      "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://api.whatsapp.com https://wa.me https://vercel.live https://*.vercel.app https://va.vercel-scripts.com",
      "frame-src 'self' https://vercel.live",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://wa.me https://api.whatsapp.com",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
  // Cross-Origin Opener Policy
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
  // Cross-Origin Resource Policy
  {
    key: 'Cross-Origin-Resource-Policy',
    value: 'same-origin',
  },
];

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Seguridad: Headers aplicados a todas las rutas
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  // Seguridad: Ocultar el header X-Powered-By de Next.js
  poweredByHeader: false,
};

export default nextConfig;
