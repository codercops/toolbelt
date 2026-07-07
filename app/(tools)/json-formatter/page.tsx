import type { Metadata } from "next";
import { JsonFormatterClient } from "./JsonFormatterClient";
import { ToolPageLayout } from "@/components/shared/ToolPageLayout";
import { generateToolMetadata } from "@/lib/toolMetadata";
import { getTool } from "@/lib/tools";

const tool = getTool("json-formatter")!;

export const metadata: Metadata = generateToolMetadata(tool);

export default function JsonFormatterPage() {
  return (
    <ToolPageLayout tool={tool}>
      <JsonFormatterClient />
    </ToolPageLayout>
  );
}
