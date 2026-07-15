import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { rowToMemory, memoryToRow, type MemoryRow } from "@/lib/db-mappers";
import type { MapMemory } from "@/types";

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("memories").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data as MemoryRow[]).map(rowToMemory));
}

export async function POST(request: Request) {
  const denied = await requireAuth();
  if (denied) return denied;

  const memory: MapMemory = await request.json();
  const row = memoryToRow(memory);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("memories")
    .upsert(row)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rowToMemory(data as MemoryRow));
}

export async function DELETE(request: Request) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { id } = await request.json();
  const supabase = getSupabaseAdmin();

  const { data: memory } = await supabase.from("memories").select("image_paths").eq("id", id).single();
  if (memory?.image_paths?.length) {
    await supabase.storage.from("media").remove(memory.image_paths);
  }

  const { error } = await supabase.from("memories").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
