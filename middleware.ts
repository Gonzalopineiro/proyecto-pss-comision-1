import { NextResponse, type NextRequest } from 'next/server'
import { updateSession, createClient } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Para todas las rutas, primero ejecutar el middleware normal de actualización de sesión
  const response = await updateSession(request)
  
  // Lista de rutas públicas que no requieren autenticación
  const publicRoutes = [
    '/login', 
    '/auth', 
    '/error',
    '/' // La página principal es pública
  ]
  
  // Verificamos si la ruta actual comienza con alguna de las rutas públicas
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(`${route}/`)
  )
  
  // Si es una ruta pública, permitimos el acceso sin verificar autenticación
  if (isPublicRoute) {
    return response
  }
  
  // Para cualquier otra ruta (incluido el dashboard), verificamos autenticación
  const supabase = createClient(request)
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    // Si no hay sesión, redirigir al login con el parámetro redirectedFrom
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // Si hay sesión, permitir el acceso
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}