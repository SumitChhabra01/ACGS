import { ContentPipelineLive } from "@/components/live/ContentPipelineLive";
import { TopBar } from "@/components/layout/TopBar";
import { PipelineBoard } from "@/components/widgets/PipelineBoard";
import { getContent, getDataMode } from "@/lib/queries";
import { isPublicDemo } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  if (isPublicDemo) {
    return <ContentPipelineLive />;
  }

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
