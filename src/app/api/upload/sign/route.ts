import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { getSupabaseAdmin, MEDIA_BUCKET } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { folder, contentType, ext } = await request.json();
  const safeExt = (ext || "bin").replace(/[^a-z0-9]/gi, "").slice(0, 8) || "bin";
  const path = `${folder || "misc"}/${crypto.randomUUID()}.${safeExt}`;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUploadUrl(path, { upsert: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    path: data.path,
    token: data.token,
  });
}
