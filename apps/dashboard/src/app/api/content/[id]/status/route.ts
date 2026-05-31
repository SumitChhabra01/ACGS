import { NextResponse } from "next/server";
import type { ContentStatus } from "@aicos/shared-types";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED: ContentStatus[] = [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "scheduled",
  "published",
  "failed",
];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { status?: string };
  const status = body.status as ContentStatus | undefined;

  if (!status || !ALLOWED.includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const sb = createAdminClient();
  if (!sb) {
    // Demo mode: no DB. Echo success so the optimistic UI still works.
    return NextResponse.json({ ok: true, id, status, persisted: false });
  }

  const { error } = await sb.from("content_items").update({ status }).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // When approved, also queue a publication so the publishing agent can pick it up.
  if (status === "scheduled" || status === "approved") {
    const { data: item } = await sb
      .from("content_items")
      .select("platform")
      .eq("id", id)
      .maybeSingle();
    if (item) {
      await sb.from("publications").insert({
        content_item_id: id,
        platform: item.platform,
        status: status === "scheduled" ? "scheduled" : "queued",
      });
    }
  }

  return NextResponse.json({ ok: true, id, status, persisted: true });
}
