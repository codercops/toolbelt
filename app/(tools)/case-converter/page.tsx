import type { Metadata } from "next";
import { CaseConverterClient } from "./CaseConverterClient";
import { ToolPageLayout } from "@/components/shared/ToolPageLayout";
import { generateToolMetadata } from "@/lib/toolMetadata";
import { getTool } from "@/lib/tools";

const tool = getTool("case-converter")!;

export const metadata: Metadata = generateToolMetadata(tool);

export default function CaseConverterPage() {
  return (
    <ToolPageLayout tool={tool}>
      <CaseConverterClient />
    </ToolPageLayout>
  );
}
