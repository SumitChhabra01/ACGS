"use client";

import { useState } from "react";
import type { ContentItem, ContentStatus } from "@aicos/shared-types";
import { Check, X, Instagram, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";

const COLUMNS: { status: ContentStatus; label: string; accent: string }[] = [
  { status: "draft", label: "Idea / Draft", accent: "text-ink-dim" },
  { status: "pending_approval", label: "Pending Approval", accent: "text-neon-amber" },
  { status: "approved", label: "Approved", accent: "text-neon-cyan" },
  { status: "scheduled", label: "Scheduled", accent: "text-neon-violet" },
  { status: "published", label: "Published", accent: "text-neon-green" },
];

export function PipelineBoard({ items, live = false }: { items: ContentItem[]; live?: boolean }) {
  const [data, setData] = useState(items);
  const [pending, setPending] = useState<string | null>(null);

  async function update(id: string, status: ContentStatus) {
    const prev = data;
    setData((d) => d.map((it) => (it.id === id ? { ...it, status } : it)));
    if (!live) return;
    setPending(id);
    try {
      const res = await fetch(`/api/content/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch {
      setData(prev); // rollback on failure
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      {COLUMNS.map((col) => {
        const cards = data.filter((d) => d.status === col.status);
        return (
          <div key={col.status} className="glass min-h-[200px] p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className={cn("text-xs font-semibold uppercase tracking-wider", col.accent)}>
                {col.label}
              </span>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-ink-faint">
                {cards.length}
              </span>
            </div>
            <div className="space-y-2">
              {cards.map((c) => (
                <article key={c.id} className="rounded-xl border border-white/10 bg-bg-soft/60 p-3">
                  <div className="mb-2 flex items-center gap-2 text-[11px] text-ink-faint">
                    {c.platform === "instagram" ? (
                      <Instagram className="h-3.5 w-3.5 text-neon-pink" />
                    ) : (
                      <Youtube className="h-3.5 w-3.5 text-neon-red" />
                    )}
                    <span className="capitalize">{c.type.replaceAll("_", " ")}</span>
                  </div>
                  <p className="line-clamp-3 text-xs text-ink-dim">{c.body}</p>
                  {c.qualityScores && (
                    <div className="mt-2 flex gap-2 text-[10px] text-ink-faint">
                      <span>eng {Math.round(c.qualityScores.engagement * 100)}</span>
                      <span>seo {Math.round(c.qualityScores.seo * 100)}</span>
                      <span>dup {Math.round(c.qualityScores.duplicate * 100)}</span>
                    </div>
                  )}
                  {c.status === "pending_approval" && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => update(c.id, "approved")}
                        disabled={pending === c.id}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-neon-green/40 bg-neon-green/10 py-1.5 text-xs text-neon-green hover:bg-neon-green/20 disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => update(c.id, "rejected")}
                        disabled={pending === c.id}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-neon-red/40 bg-neon-red/10 px-2.5 py-1.5 text-xs text-neon-red hover:bg-neon-red/20 disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  {c.status === "approved" && (
                    <button
                      onClick={() => update(c.id, "scheduled")}
                      disabled={pending === c.id}
                      className="mt-3 w-full rounded-lg border border-neon-violet/40 bg-neon-violet/10 py-1.5 text-xs text-neon-violet hover:bg-neon-violet/20 disabled:opacity-50"
                    >
                      Schedule
                    </button>
                  )}
                </article>
              ))}
              {cards.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-[11px] text-ink-faint">
                  empty
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
