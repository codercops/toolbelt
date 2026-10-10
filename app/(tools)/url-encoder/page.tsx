import type { Metadata } from "next";
import { UrlEncoderClient } from "./UrlEncoderClient";
import { ToolPageLayout } from "@/components/shared/ToolPageLayout";
import { generateToolMetadata } from "@/lib/toolMetadata";
import { getTool } from "@/lib/tools";

const tool = getTool("url-encoder")!;

export const metadata: Metadata = generateToolMetadata(tool);

export default function UrlEncoderPage() {
  return (
    <ToolPageLayout tool={tool}>
      <UrlEncoderClient />
    </ToolPageLayout>
  );
}
