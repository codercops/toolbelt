import type { Metadata } from "next";
import { TimestampConverterClient } from "./TimestampConverterClient";
import { ToolPageLayout } from "@/components/shared/ToolPageLayout";
import { generateToolMetadata } from "@/lib/toolMetadata";
import { getTool } from "@/lib/tools";

const tool = getTool("timestamp-converter")!;
export const metadata: Metadata = generateToolMetadata(tool);

export default function TimestampConverterPage() {
  return (
    <ToolPageLayout tool={tool}>
      <TimestampConverterClient />
    </ToolPageLayout>
  );
}
