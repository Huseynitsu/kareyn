import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { rowToPlan, planToRow, type PlanRow } from "@/lib/db-mappers";
import type { TravelPlan } from "@/types";

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("travel_plans").select("*").order("date", { ascending: true, nullsFirst: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data as PlanRow[]).map(rowToPlan));
}

export async function POST(request: Request) {
  const denied = await requireAuth();
  if (denied) return denied;

  const plan: TravelPlan = await request.json();
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.from("travel_plans").upsert(planToRow(plan)).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(rowToPlan(data as PlanRow));
}

export async function DELETE(request: Request) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { id } = await request.json();
  const supabase = getSupabaseAdmin();

  const { data: plan } = await supabase.from("travel_plans").select("image_path").eq("id", id).single();
  if (plan?.image_path) {
    await supabase.storage.from("media").remove([plan.image_path]);
  }

  const { error } = await supabase.from("travel_plans").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
