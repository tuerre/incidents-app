import { NextRequest, NextResponse } from "next/server";

/**
 * Lightweight middleware that checks if a Supabase auth cookie is present
 * before allowing access to /dashboard routes.
 * Full role validation happens server-side in the dashboard page itself.
 */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith("/dashboard")) {
        // Supabase persists the session in a cookie named "sb-<project>-auth-token"
        const hasSession = Array.from(request.cookies.getAll()).some(
            (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
        );

        if (!hasSession) {
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*"],
};
