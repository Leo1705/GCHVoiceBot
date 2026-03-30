import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "nora_session";

function getSecret() {
  const s = process.env.AUTH_SECRET;
  if (s && String(s).trim()) return String(s).trim();
  return "dev-insecure-secret-change-me";
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/session") && pathname !== "/start") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(getSecret()));
    return NextResponse.next();
  } catch {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/session/:path*", "/start"],
};
