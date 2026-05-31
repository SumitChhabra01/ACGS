import { TopBar } from "@/components/layout/TopBar";
import { PipelineBoard } from "@/components/widgets/PipelineBoard";
import { getContent, getDataMode } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const [items, mode] = await Promise.all([getContent(), getDataMode()]);
  return (
    <div>
      <TopBar
        title="Content Pipeline"
        subtitle={
          mode.live
            ? "Idea → Draft → Approval → Scheduled → Published (live)"
            : "Idea → Draft → Approval → Scheduled → Published (demo data)"
        }
      />
      <PipelineBoard items={items} live={mode.live} />
    </div>
  );
}
