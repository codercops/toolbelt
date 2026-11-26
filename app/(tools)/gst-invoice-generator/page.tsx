import type { Metadata } from "next";
import { GstInvoiceGeneratorClient } from "./GstInvoiceGeneratorClient";
import { ToolPageLayout } from "@/components/shared/ToolPageLayout";
import { generateToolMetadata } from "@/lib/toolMetadata";
import { getTool } from "@/lib/tools";

const tool = getTool("gst-invoice-generator")!;

export const metadata: Metadata = generateToolMetadata(tool);

export default function GstInvoiceGeneratorPage() {
  return (
    <ToolPageLayout tool={tool}>
      <GstInvoiceGeneratorClient />
    </ToolPageLayout>
  );
}
