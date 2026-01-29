import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        // In Next.js middleware, the request cookies are immutable.
        // We only set cookies on the response.
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  // Refresh session if needed
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/settings");

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

