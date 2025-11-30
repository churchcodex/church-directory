import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/signup");
    const isAdminPage = req.nextUrl.pathname.startsWith("/admin");

    // Redirect authenticated users away from auth pages
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Check admin access
    if (isAdminPage) {
      if (!isAuth) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      if ((token as any).role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/signup");

        // Allow access to auth pages without token
        if (isAuthPage) {
          return true;
        }

        // Require token for all other protected routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/", "/churches/:path*", "/clergy/:path*", "/admin/:path*", "/login", "/signup"],
};
