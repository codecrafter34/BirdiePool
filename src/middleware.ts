import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');
  const isAdmin = request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin-login');
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || 
                      request.nextUrl.pathname.startsWith('/signup') || 
                      request.nextUrl.pathname.startsWith('/forgot-password') ||
                      request.nextUrl.pathname.startsWith('/admin-login');

  let userRole = null;
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    userRole = profile?.role;
  }

  // Rule 1: Dashboard and Admin routes -> authenticated users only
  if (!user && (isDashboard || isAdmin)) {
    const url = request.nextUrl.clone();
    url.pathname = isAdmin ? '/admin-login' : '/login';
    return NextResponse.redirect(url);
  }

  // Rule 2: Auth routes -> redirect authenticated users to their respective portals
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = userRole === 'admin' ? '/admin' : '/dashboard';
    return NextResponse.redirect(url);
  }

  // Rule 3: Admin routes -> admin role only
  if (user && isAdmin) {
    if (userRole !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // Rule 4: Dashboard routes -> subscribers/visitors only
  if (user && isDashboard) {
    if (userRole === 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /* Match all request paths except static files, images, icons */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
