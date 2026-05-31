import { TopBar } from "@/components/layout/TopBar";
import { PipelineBoard } from "@/components/widgets/PipelineBoard";
import { getContent, getDataMode } from "@/lib/queries";
import { isPublicDemo } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const [items, mode] = await Promise.all([getContent(), getDataMode()]);
  return (
    <div>
      <TopBar
        title="Content Pipeline"
        subtitle={
          isPublicDemo
            ? "Public preview — read-only sample pipeline"
            : mode.live
              ? "Idea → Draft → Approval → Scheduled → Published (live)"
              : "Idea → Draft → Approval → Scheduled → Published (demo data)"
        }
      />
      <PipelineBoard items={items} live={!isPublicDemo && mode.live} />
    </div>
  );
}
