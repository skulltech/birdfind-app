import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getOauthAccountByUser } from "./utils/nextauth";

export const middleware = async (req: NextRequest) => {
  const url = req.nextUrl.clone();

  const token = await getToken({ req });
  const oauthAccount = token
    ? await getOauthAccountByUser(token.sub, "twitter")
    : null;

  // NextAuth routes are always allowed
  if (url.pathname.startsWith("/api/auth")) return;

  // If it's an API route then redirect to 401 api route
  if (url.pathname.startsWith("/api")) {
    if (token && oauthAccount) return;
    return NextResponse.redirect(new URL("/api/auth/unauthorized", req.url));
  }

  // Sign in page
  if (url.pathname.startsWith("/account/signin")) {
    if (!token) return;
    if (token && !oauthAccount)
      return NextResponse.redirect(new URL("/account/update", req.url));
    return NextResponse.redirect(new URL("/", req.url));
  }

  // If it's a frontend route then redirect to signin page or update page
  if (token) {
    if (oauthAccount) return;
    else return NextResponse.redirect(new URL("/account/update", req.url));
  } else {
    return NextResponse.redirect(new URL("/account/signin", req.url));
  }
};

export const config = {
  matcher: "/",
};
