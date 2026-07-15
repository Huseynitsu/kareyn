import { NextResponse } from "next/server";
import { isAuthenticated } from "./auth";

export async function requireAuth(): Promise<NextResponse | null> {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
