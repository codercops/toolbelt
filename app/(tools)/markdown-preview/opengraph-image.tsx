import { getTool } from "@/lib/tools";
import { renderToolOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

const tool = getTool("markdown-preview")!;
export const alt = tool.ogTitle;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpenGraphImage() {
  return renderToolOgImage(tool);
}
