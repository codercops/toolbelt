import type { Metadata } from "next";
import { CsvFormatterClient } from "./CsvFormatterClient";
import { ToolPageLayout } from "@/components/shared/ToolPageLayout";
import { generateToolMetadata } from "@/lib/toolMetadata";
import { getTool } from "@/lib/tools";

const tool = getTool("csv-formatter")!;

export const metadata: Metadata = generateToolMetadata(tool);

export default function CsvFormatterPage() {
  return (
    <ToolPageLayout tool={tool}>
      <CsvFormatterClient />
    </ToolPageLayout>
  );
}
