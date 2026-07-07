import type { Metadata } from "next";
import { JwtDecoderClient } from "./JwtDecoderClient";
import { ToolPageLayout } from "@/components/shared/ToolPageLayout";
import { generateToolMetadata } from "@/lib/toolMetadata";
import { getTool } from "@/lib/tools";

const tool = getTool("jwt-decoder")!;

export const metadata: Metadata = generateToolMetadata(tool);

export default function JwtDecoderPage() {
  return (
    <ToolPageLayout tool={tool}>
      <JwtDecoderClient />
    </ToolPageLayout>
  );
}
