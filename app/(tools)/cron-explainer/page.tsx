import type { Metadata } from "next";
import { CronExplainerClient } from "./CronExplainerClient";
import { ToolPageLayout } from "@/components/shared/ToolPageLayout";
import { generateToolMetadata } from "@/lib/toolMetadata";
import { getTool } from "@/lib/tools";

const tool = getTool("cron-explainer")!;

export const metadata: Metadata = generateToolMetadata(tool);

export default function CronExplainerPage() {
  return (
    <ToolPageLayout tool={tool}>
      <CronExplainerClient />
    </ToolPageLayout>
  );
}
