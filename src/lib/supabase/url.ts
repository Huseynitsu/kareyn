/** Base project URL only — no /rest/v1 or other API suffixes. */
export function normalizeSupabaseProjectUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, "");
  url = url.replace(/\/rest\/v1$/i, "");
  url = url.replace(/\/storage\/v1$/i, "");
  url = url.replace(/\/auth\/v1$/i, "");
  url = url.replace(/\/functions\/v1$/i, "");
  return url;
}

export function formatSupabaseError(error: { message?: string; code?: string }, step: string): string {
  const msg = error.message ?? "Unknown error";
  const code = error.code ?? "";

  if (
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("Network request failed")
  ) {
    return (
      `${step}: Cannot reach Supabase. Open Supabase → Settings → API → copy Project URL ` +
      `into Vercel NEXT_PUBLIC_SUPABASE_URL (https://xxx.supabase.co only), then Redeploy. ` +
      `Test the URL in your browser first — it must open.`
    );
  }

  if (msg.includes("Invalid path") || code === "PGRST125") {
    return (
      `${step}: Supabase URL is wrong. In Vercel set NEXT_PUBLIC_SUPABASE_URL to ` +
      `https://YOUR_PROJECT.supabase.co only (no /rest/v1 at the end), then Redeploy.`
    );
  }

  if (
    msg.includes("schema cache") ||
    code === "PGRST205" ||
    msg.includes("Could not find the table")
  ) {
    return `${step}: Database tables missing. Open Supabase → SQL Editor, paste supabase/schema.sql, and Run.`;
  }

  if (msg.includes("Invalid API key") || msg.includes("JWT")) {
    return `${step}: Supabase API key is wrong. Add NEXT_PUBLIC_SUPABASE_ANON_KEY (eyJ...) in Vercel and Redeploy.`;
  }

  return `${step}: ${msg}${code ? ` (${code})` : ""}`;
}
