import { NextResponse, userAgent } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { getUserDetails } from "./utils/supabase";

const unauthorized = () =>
  new NextResponse(JSON.stringify({ message: "You are not authorized" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });

export const middleware = async (req: NextRequest) => {
  const path = req.nextUrl.pathname;

  // To fix bug with latest NextJS
  if (path.startsWith("/_next")) return;

  // Allow images
  if (path.startsWith("/images")) return;

  // Redirect to unsupported-device page when accessed from mobile
  if (path.startsWith("/unsupported-device")) return;
  const { device } = userAgent(req);
  if (device.type == "mobile")
    return NextResponse.redirect(new URL("/unsupported-device", req.url));

  const res = NextResponse.next();
  const supabase = createMiddlewareSupabaseClient({ req, res });

  const user = await getUserDetails(supabase);
  const userTwitter = user ? user.twitter : null;

  // Auth API routes
  if (path.startsWith("/api/auth")) {
    if (user) return;
    return unauthorized();
  }

  // Backend API routes
  if (path.startsWith("/api/birdfind")) {
    if (user && userTwitter) return;
    return unauthorized();
  }

  // Sign in page
  if (path.startsWith("/auth/signin")) {
    if (user && !userTwitter)
      return NextResponse.redirect(new URL("/account", req.url));
    if (user && userTwitter)
      return NextResponse.redirect(new URL("/", req.url));
    return;
  }

  // Twitter linking page
  if (path.startsWith("/account")) {
    if (user) return;
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  // For all the rest
  if (!user) return NextResponse.redirect(new URL("/auth/signin", req.url));
  if (user && !userTwitter)
    return NextResponse.redirect(new URL("/account", req.url));
};
