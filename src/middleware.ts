import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// FAST TRAVEL XAUXA — ANTI-DDOS, INTRUSION DETECTION & SECURITY MIDDLEWARE
// ============================================================================

// Memoria volátil para Rate Limiting por IP (Sliding Window)
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();

// Rutas de sondas maliciosas y escáneres comunes a bloquear inmediatamente
const BLOCKED_PROBE_PATTERNS = [
  /^\/\.env/i,
  /^\/\.git/i,
  /^\/\.aws/i,
  /^\/wp-(admin|login|content|includes)/i,
  /^\/xmlrpc\.php/i,
  /^\/(phpmyadmin|pma|adminer)/i,
  /^\/(cgi-bin|solr|actuator)/i,
  /^\/(phpunit|vendor|eval-stdin)/i,
  /^\/(telescope|_profiler|debug)/i,
  /\.(php|asp|aspx|jsp|cgi|sh|bash|sql|bak|yml|yaml)$/i,
];

// Patrones de inyección en URLs y query params
const SUSPICIOUS_PARAM_PATTERNS = [
  /(\.\.|\%2e\%2e)(\/|\\)/i,       // Path traversal
  /(<script|\%3cscript)/i,          // XSS en query
  /(union(\s|\+)+select)/i,        // SQL injection intento
  /(benchmark|waitfor delay)/i,    // Blind SQL injection
];

// Límites de solicitudes por minuto según la ruta
const RATE_LIMITS = {
  adminLogin: { max: 15, windowMs: 60 * 1000 },  // Anti fuerza bruta en login
  reservation: { max: 35, windowMs: 60 * 1000 }, // Anti spam en reservas
  general: { max: 120, windowMs: 60 * 1000 },    // Límite general anti-DDoS
};

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. FILTRADO DE PROBES MALICIOSOS (WAF Ligero a Nivel de Edge)
  for (const pattern of BLOCKED_PROBE_PATTERNS) {
    if (pattern.test(pathname)) {
      return new NextResponse('Forbidden: Solicitud rechazada por seguridad.', {
        status: 403,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  }

  // 2. DETECCIÓN DE INYECCIONES Y TRAVERSAL EN QUERY STRING
  if (search) {
    for (const pattern of SUSPICIOUS_PARAM_PATTERNS) {
      if (pattern.test(search)) {
        return new NextResponse('Bad Request: Caracteres sospechosos detectados.', {
          status: 400,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
    }
  }

  // 3. OBTENER IP DEL CLIENTE
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || '127.0.0.1');

  // 4. RATE LIMITING ANTI-DDOS POR IP
  let limitConfig = RATE_LIMITS.general;
  if (pathname.startsWith('/admin/login')) {
    limitConfig = RATE_LIMITS.adminLogin;
  } else if (pathname.startsWith('/reserva') && request.method === 'POST') {
    limitConfig = RATE_LIMITS.reservation;
  }

  const rateKey = `${clientIp}:${pathname.startsWith('/admin/login') ? 'login' : 'gen'}`;
  const now = Date.now();
  const currentRecord = ipRequestCounts.get(rateKey);

  if (!currentRecord || now > currentRecord.resetAt) {
    ipRequestCounts.set(rateKey, { count: 1, resetAt: now + limitConfig.windowMs });
  } else {
    currentRecord.count += 1;
    if (currentRecord.count > limitConfig.max) {
      // Limpieza periódica para evitar fugas de memoria
      if (ipRequestCounts.size > 5000) {
        for (const [key, val] of ipRequestCounts.entries()) {
          if (now > val.resetAt) ipRequestCounts.delete(key);
        }
      }

      return new NextResponse(
        JSON.stringify({
          error: 'Demasiadas solicitudes detectadas desde su red. Por favor espere 1 minuto (Protección Anti-DDoS Fast Travel Xauxa).',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Retry-After': '60',
          },
        }
      );
    }
  }

  // 5. PROCESAR RESPUESTA Y AÑADIR HEADERS DE SEGURIDAD ESTRICTOS
  const response = NextResponse.next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-RateLimit-Limit', limitConfig.max.toString());
  response.headers.set('X-RateLimit-Remaining', Math.max(0, limitConfig.max - (currentRecord?.count || 1)).toString());

  // En rutas administrativas, prohibir almacenamiento en caché de proxys
  if (pathname.startsWith('/admin')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public images)
     * - banners/ (public banners)
     */
    '/((?!_next/static|_next/image|favicon.ico|images/|banners/|manifest.json).*)',
  ],
};
