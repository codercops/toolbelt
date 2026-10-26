import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/shared/ToolPageLayout";
import { generateToolMetadata } from "@/lib/toolMetadata";
import { getTool } from "@/lib/tools";
import { MarkdownPreviewClient } from "./MarkdownPreviewClient";

const tool = getTool("markdown-preview")!;
export const metadata: Metadata = generateToolMetadata(tool);

export default function MarkdownPreviewPage() {
  return <ToolPageLayout tool={tool}><MarkdownPreviewClient /></ToolPageLayout>;
}
