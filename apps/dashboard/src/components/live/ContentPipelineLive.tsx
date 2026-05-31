"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Panel } from "@/components/ui/Panel";
import { PipelineBoard } from "@/components/widgets/PipelineBoard";
import { fetchContent } from "@/lib/live-client";
import type { ContentItem } from "@aicos/shared-types";

export function ContentPipelineLive() {
  const [items, setItems] = useState<ContentItem[] | null>(null);

  useEffect(() => {
    fetchContent().then(setItems);
  }, []);

  if (items === null) {
    return (
      <div>
        <TopBar title="Content Pipeline" subtitle="Loading live drafts…" />
      </div>
    );
  }

  return (
    <div>
      <TopBar
        title="Content Pipeline"
        subtitle="Live from Supabase — read-only on public site (approve locally)"
      />
      {items.length === 0 ? (
        <Panel title="No drafts yet">
          <p className="text-sm text-ink-dim">
            Content agent runs every 12 hours. After the workflow completes, refresh to see new
            drafts.
          </p>
        </Panel>
      ) : (
        <PipelineBoard items={items} live={false} />
      )}
    </div>
  );
}
