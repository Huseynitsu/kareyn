import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { rowToMediaItem, type MediaRow } from "@/lib/db-mappers";
import type { MediaItem } from "@/types";

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("edit_items").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data as MediaRow[]).map(rowToMediaItem));
}

export async function POST(request: Request) {
  const denied = await requireAuth();
  if (denied) return denied;

  const item: MediaItem = await request.json();
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("edit_items")
    .upsert({
      id: item.id,
      type: item.type,
      storage_path: item.blobId,
      title: item.title,
      caption: item.caption,
      created_at: item.createdAt,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rowToMediaItem(data as MediaRow));
}

export async function DELETE(request: Request) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { id } = await request.json();
  const supabase = getSupabaseAdmin();

  const { data: item } = await supabase.from("edit_items").select("storage_path").eq("id", id).single();
  if (item?.storage_path) {
    await supabase.storage.from("media").remove([item.storage_path]);
  }

  const { error } = await supabase.from("edit_items").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
