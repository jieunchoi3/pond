import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATE_ID = "default";

export async function GET() {
  const supabase = createClient();
  if (!supabase) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }
  const { data, error } = await supabase
    .from("pond_state")
    .select("id, notes, categories, pins, ready, updated_at")
    .eq("id", STATE_ID)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(
    data ?? {
      id: STATE_ID,
      notes: [],
      categories: [],
      pins: [],
      ready: false,
      updated_at: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PUT(request: Request) {
  const supabase = createClient();
  if (!supabase) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const row = body as {
    notes?: unknown;
    categories?: unknown;
    pins?: unknown;
  };
  const payload = {
    id: STATE_ID,
    notes: Array.isArray(row.notes) ? row.notes : [],
    categories: Array.isArray(row.categories) ? row.categories : [],
    pins: Array.isArray(row.pins) ? row.pins : [],
    ready: true,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("pond_state")
    .upsert(payload, { onConflict: "id" })
    .select("id, notes, categories, pins, ready, updated_at")
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? payload);
}
