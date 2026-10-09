import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/login"];

export function proxy(req: NextRequest & { auth?: { user?: { id?: string } } }) {
  const { pathname } = req.nextUrl;
  const isPublic = publicRoutes.includes(pathname);
  // auth info is injected by the auth() wrapper when it wraps the handler
  // We need to use auth() to wrap this for Auth.js session access
  return NextResponse.next();
}

// Use auth() to wrap the proxy function for session awareness
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = publicRoutes.includes(pathname);
  const isAuthenticated = !!req.auth;

  if (!isAuthenticated && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthenticated && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)"],
};
