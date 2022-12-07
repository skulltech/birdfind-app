import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { getUserProfile } from "./utils/supabase";

const unauthorized = () =>
  new NextResponse(JSON.stringify({ message: "You are not authorized" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });

export const middleware = async (req: NextRequest) => {
  const path = req.nextUrl.pathname;

  // To fix bug with latest NextJS
  if (path.startsWith("/_next")) return;

  const res = NextResponse.next();
  const supabase = createMiddlewareSupabaseClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const profile = await getUserProfile(supabase);
  const twitterId = profile ? profile.twitter_id : null;

  // Auth API routes
  if (path.startsWith("/api/auth")) {
    if (session) return;
    return unauthorized();
  }

  // User API routes
  if (path.startsWith("/api/user")) {
    if (session && twitterId) return;
    return unauthorized();
  }

  // Sign in page
  if (path.startsWith("/auth/signin")) {
    if (session && !twitterId)
      return NextResponse.redirect(new URL("/auth/twitter", req.url));
    if (session && twitterId)
      return NextResponse.redirect(new URL("/", req.url));
    return;
  }

  // Twitter linking page
  if (path.startsWith("/auth/twitter")) {
    if (session) return;
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  // For all the rest
  if (!session) return NextResponse.redirect(new URL("/auth/signin", req.url));
  if (session && !twitterId)
    return NextResponse.redirect(new URL("/auth/twitter", req.url));
};
