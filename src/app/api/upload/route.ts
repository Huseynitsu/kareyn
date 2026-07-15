import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { getSupabaseAdmin, getMediaPublicUrl, MEDIA_BUCKET } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const denied = await requireAuth();
  if (denied) return denied;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "misc";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const supabase = getSupabaseAdmin();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    path,
    url: getMediaPublicUrl(path),
  });
}

export async function DELETE(request: Request) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { path } = await request.json();
  if (!path) return NextResponse.json({ error: "No path" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
