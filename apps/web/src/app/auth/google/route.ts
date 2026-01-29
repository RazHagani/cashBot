import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "@/lib/supabase/env";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;

  // Capture cookies set by Supabase SSR client, then apply to final response.
  const cookiesToSet: Array<{ name: string; value: string; options?: any }> = [];

  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.push(...cookies);
      }
    }
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`
    }
  });

  if (error || !data.url) {
    const res = NextResponse.redirect(new URL("/login?error=oauth_start_failed", origin), 302);
    cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  }

  const res = NextResponse.redirect(data.url, 302);
  cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}

