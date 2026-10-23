import type { Metadata } from "next";
import { UuidGeneratorClient } from "./UuidGeneratorClient";
import { ToolPageLayout } from "@/components/shared/ToolPageLayout";
import { generateToolMetadata } from "@/lib/toolMetadata";
import { getTool } from "@/lib/tools";

const tool = getTool("uuid-generator")!;

export const metadata: Metadata = generateToolMetadata(tool);

export default function UuidGeneratorPage() {
  return (
    <ToolPageLayout tool={tool}>
      <UuidGeneratorClient />
    </ToolPageLayout>
  );
}
