import type { Metadata } from "next";
import { InvoiceGeneratorClient } from "./InvoiceGeneratorClient";
import { ToolPageLayout } from "@/components/shared/ToolPageLayout";
import { generateToolMetadata } from "@/lib/toolMetadata";
import { getTool } from "@/lib/tools";

const tool = getTool("invoice-generator")!;

export const metadata: Metadata = generateToolMetadata(tool);

export default function InvoiceGeneratorPage() {
  return (
    <ToolPageLayout tool={tool}>
      <InvoiceGeneratorClient />
    </ToolPageLayout>
  );
}
