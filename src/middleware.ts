import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Matriz de permisos RBAC para rutas de Next.js en el Servidor / Edge (Vercel)
const ROLE_PERMISSIONS: Record<string, string[]> = {
  '/dashboard/simulador': ['ADMINISTRADOR', 'GESTOR_PERSONAL', 'SUPERVISOR_ACCESOS'],
  '/dashboard/personal': ['ADMINISTRADOR', 'GESTOR_PERSONAL'],
  '/dashboard/usuarios': ['ADMINISTRADOR'],
  '/dashboard/carga-masiva': ['ADMINISTRADOR', 'GESTOR_PERSONAL'],
  '/dashboard/catalogos': ['ADMINISTRADOR', 'GESTOR_PERSONAL'],
  '/dashboard/historial': ['ADMINISTRADOR', 'GESTOR_PERSONAL', 'SUPERVISOR_ACCESOS'],
  '/dashboard/socio-sync': ['ADMINISTRADOR', 'SUPERVISOR_ACCESOS'],
  '/dashboard/auditoria': ['ADMINISTRADOR', 'SUPERVISOR_ACCESOS'],
};

// Función auxiliar para decodificar el payload de JWT sin dependencias en Edge
function parseJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = atob(base64);
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorar archivos estáticos, api interna de next, archivos con . y rutas internas (/_...)
  if (
    pathname.startsWith('/_') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 1. Leer el token JWT y el rol desde cookies seguras
  const token = request.cookies.get('zone_control_token')?.value;
  let userRole = request.cookies.get('zone_control_role')?.value;

  // Si no hay rol en la cookie, intentar extraerlo del payload JWT
  if (token && !userRole) {
    const payload = parseJwtPayload(token);
    if (payload && payload.rol) {
      userRole = payload.rol;
    }
  }

  // 2. Si un usuario autenticado intenta entrar a /login, redirigirlo a /dashboard/simulador
  if (pathname === '/login' && token && token.trim() !== '') {
    return NextResponse.redirect(new URL('/dashboard/simulador', request.url), 307);
  }

  // 3. Si un usuario sin token intenta entrar a /dashboard/:path*, redirigirlo a /login (HTTP 307)
  if (pathname.startsWith('/dashboard')) {
    if (!token || token.trim() === '') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(loginUrl, 307);
    }

    // 4. Verificación de Roles en el Edge (RBAC)
    const allowedRoles = ROLE_PERMISSIONS[pathname];
    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
      return NextResponse.redirect(new URL('/dashboard/simulador', request.url), 307);
    }
  }

  // 5. Redirección limpia de rutas no reconocidas a la raíz
  const validPublicRoutes = ['/', '/login', '/molinete'];
  if (!pathname.startsWith('/dashboard') && !validPublicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url), 307);
  }

  const response = NextResponse.next();

  // 6. Inyección dinámica de cabeceras anti-caché (no-store) en cada petición evaluada
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');

  // Cabeceras de protección
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=()');

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
