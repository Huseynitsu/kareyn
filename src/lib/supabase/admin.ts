import { createClient } from "@supabase/supabase-js";

import { normalizeSupabaseProjectUrl } from "@/lib/supabase/url";

export function getSupabaseAdmin() {
  const url = normalizeSupabaseProjectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export function getMediaPublicUrl(storagePath: string): string {
  const url = normalizeSupabaseProjectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  const encoded = storagePath
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
  return `${url}/storage/v1/object/public/media/${encoded}`;
}

export const MEDIA_BUCKET = "media";
