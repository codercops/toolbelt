import { getTool } from "@/lib/tools";
import { renderToolOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

const tool = getTool("invoice-generator")!;

export const alt = tool.ogTitle;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderToolOgImage(tool);
}
