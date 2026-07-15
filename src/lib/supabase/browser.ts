import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();

  if (!url || !key) {
    throw new Error(
      "Missing Supabase keys. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to Vercel."
    );
  }

  if (!url.startsWith("https://") || !url.includes(".supabase.co")) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must look like https://xxx.supabase.co");
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export const MEDIA_BUCKET = "media";

export function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
  };
  const lower = mime.toLowerCase();
  if (map[lower]) return map[lower];
  const part = lower.split("/")[1]?.split("+")[0]?.split(";")[0];
  return part?.replace(/[^a-z0-9]/g, "") || "bin";
}

export function buildStoragePath(folder: string, mimeType: string): string {
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, "") || "misc";
  const ext = mimeToExt(mimeType);
  return `${safeFolder}/${crypto.randomUUID()}.${ext}`;
}

export function normalizeStoragePath(storagePath: string): string {
  let path = storagePath.replace(/^\/+/, "").replace(/\/+/g, "/");
  if (path.startsWith(`${MEDIA_BUCKET}/`)) {
    path = path.slice(MEDIA_BUCKET.length + 1);
  }
  return path;
}

export function getMediaPublicUrl(storagePath: string): string | null {
  const path = normalizeStoragePath(storagePath);
  if (!path || !path.includes("/")) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "");
  const encoded = path.split("/").filter(Boolean).map(encodeURIComponent).join("/");
  return `${url}/storage/v1/object/public/${MEDIA_BUCKET}/${encoded}`;
}
