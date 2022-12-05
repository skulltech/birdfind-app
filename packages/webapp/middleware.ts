import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export const middleware = async (req: NextRequest) => {
  const url = req.nextUrl.clone();

  // Following two paths are always allowed to pass
  if (
    url.pathname.startsWith("/account") ||
    url.pathname.startsWith("/api/auth")
  )
    return;

  const token = await getToken({ req });
  if (token) return;

  // If it's an API route then redirect to 401 api route
  if (url.pathname.startsWith("/api"))
    return NextResponse.redirect(new URL("/api/auth/unauthorized", req.url));
  // If it's a frontend route then redirect to signin page
  else return NextResponse.redirect(new URL("/account/signin", req.url));
};

export const config = {
  matcher: "/",
};
