import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
    const token = await getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
        cookieName: "next-auth.session-token", // Explicitly match the name defined in auth.ts
        secureCookie: process.env.NODE_ENV === "production",
    });

    const { pathname } = request.nextUrl;

    // Admin routes - require ADMIN or OPERATOR role
    // Admin routes - require ADMIN or OPERATOR role
    if (pathname.startsWith("/admin")) {
        console.log("MW_DEBUG: Path:", pathname, "Token:", !!token, "Role:", token?.role);

        // Allow access to login page for everyone, but redirect logged-in admins to dashboard
        if (pathname === "/admin/login") {
            if (token && (token.role === "ADMIN" || token.role === "OPERATOR")) {
                return NextResponse.redirect(new URL("/admin", request.url));
            }
            return NextResponse.next();
        }

        if (!token) {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }
        if (token.role !== "ADMIN" && token.role !== "OPERATOR") {
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    // Protected routes - require authentication
    // Protected routes - require authentication
    // Orders should probably require auth or a special token, but for now let's keep orders protected
    // Cart and Checkout should be public for B2C guests
    // Orders should be accessible to guests (verification happens in page)
    /* 
    if (pathname.startsWith("/orders")) {
        if (!token) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }
    */

    const response = NextResponse.next();

    // Security Headers
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");

    // HSTS (Strict-Transport-Security) - Enabled in Production
    if (process.env.NODE_ENV === "production") {
        response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }

    return response;
}

export const config = {
    matcher: [
        "/admin/:path*",
        "/orders/:path*",
    ],
};
