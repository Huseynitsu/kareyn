import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/api-utils";
import { normalizeSupabaseProjectUrl, formatSupabaseError } from "@/lib/supabase/url";

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;

  const url = normalizeSupabaseProjectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();

  if (!url || !key) {
    return NextResponse.json({
      ok: false,
      error: "Missing NEXT_PUBLIC_SUPABASE_URL or API key in Vercel env. Redeploy after adding them.",
    });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  try {
    const { error } = await supabase.from("memories").select("id").limit(1);

    if (error) {
      return NextResponse.json({
        ok: false,
        error: formatSupabaseError(error, "Supabase health check"),
        code: error.code,
        url,
        hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
      });
    }
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: `Cannot reach ${url}. Copy Project URL from Supabase dashboard and Redeploy Vercel.`,
      url,
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    });
  }

  return NextResponse.json({ ok: true, url });
}
