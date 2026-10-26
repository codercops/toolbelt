import type { Metadata } from "next";
import { RegexTesterClient } from "./RegexTesterClient";
import { ToolPageLayout } from "@/components/shared/ToolPageLayout";
import { generateToolMetadata } from "@/lib/toolMetadata";
import { getTool } from "@/lib/tools";

const tool = getTool("regex-tester")!;

export const metadata: Metadata = generateToolMetadata(tool);

export default function RegexTesterPage() {
  return (
    <ToolPageLayout tool={tool}>
      <RegexTesterClient />
    </ToolPageLayout>
  );
}
