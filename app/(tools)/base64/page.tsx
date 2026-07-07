import type { Metadata } from "next";
import { Base64Client } from "./Base64Client";
import { ToolPageLayout } from "@/components/shared/ToolPageLayout";
import { generateToolMetadata } from "@/lib/toolMetadata";
import { getTool } from "@/lib/tools";

const tool = getTool("base64")!;

export const metadata: Metadata = generateToolMetadata(tool);

export default function Base64Page() {
  return (
    <ToolPageLayout tool={tool}>
      <Base64Client />
    </ToolPageLayout>
  );
}
