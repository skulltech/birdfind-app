import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { getUserProfile } from "./utils/supabase";

export const middleware = async (req: NextRequest) => {
  const url = req.nextUrl.clone();

  // The API unauthorized route is always allowed
  if (url.pathname.startsWith("/api/auth/unauthorized")) return;

  const res = NextResponse.next();
  const supabase = createMiddlewareSupabaseClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const profile = await getUserProfile(supabase);
  const twitterId = profile ? profile.twitter_id : null;

  // If it's an API route then redirect to 401 api route
  if (url.pathname.startsWith("/api")) {
    if (session && twitterId) return;
    return NextResponse.redirect(new URL("/api/auth/unauthorized", req.url));
  }

  // Sign in page
  if (url.pathname.startsWith("/auth/signin")) {
    if (!session) return;
    if (session && !twitterId)
      return NextResponse.redirect(new URL("/auth/twitter", req.url));
    return NextResponse.redirect(new URL("/", req.url));
  }

  // If it's a frontend route then redirect to signin page or twitter page
  if (session) {
    if (twitterId) return;
    else return NextResponse.redirect(new URL("/auth/twitter", req.url));
  } else {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }
};

export const config = {
  matcher: "/",
};
