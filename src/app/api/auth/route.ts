import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  verifySitePassword,
  createSessionToken,
  sessionCookieOptions,
  clearSessionCookieOptions,
  isAuthenticated,
} from "@/lib/auth";

export async function GET() {
  const authed = await isAuthenticated();
  return NextResponse.json({ authenticated: authed });
}

export async function POST(request: Request) {
  const { password } = await request.json();
  if (!password || !verifySitePassword(password)) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const token = createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieOptions(token));

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set(clearSessionCookieOptions());
  return NextResponse.json({ ok: true });
}
