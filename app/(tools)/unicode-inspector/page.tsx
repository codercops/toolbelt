import type { Metadata } from "next";
import { UnicodeInspectorClient } from "./UnicodeInspectorClient";
import { ToolPageLayout } from "@/components/shared/ToolPageLayout";
import { generateToolMetadata } from "@/lib/toolMetadata";
import { getTool } from "@/lib/tools";

const tool = getTool("unicode-inspector")!;

export const metadata: Metadata = generateToolMetadata(tool);

export default function UnicodeInspectorPage() {
  return (
    <ToolPageLayout tool={tool}>
      <UnicodeInspectorClient />
    </ToolPageLayout>
  );
}
