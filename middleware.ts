import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const LOGIN_PATH = "/login";
const DASHBOARD_HOME = "/dashboard/inventory";
const ADMIN_ONLY_PATHS = ["/dashboard/products", "/dashboard/managers", "/dashboard/restaurants"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (pathname === "/") {
    return NextResponse.redirect(new URL(token ? DASHBOARD_HOME : LOGIN_PATH, request.url));
  }

  if (!token && pathname.startsWith("/dashboard")) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    token &&
    typeof token.role === "string" &&
    token.role !== "ADMIN" &&
    ADMIN_ONLY_PATHS.some((adminPath) => pathname === adminPath || pathname.startsWith(`${adminPath}/`))
  ) {
    return NextResponse.redirect(new URL(DASHBOARD_HOME, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*"],
};
