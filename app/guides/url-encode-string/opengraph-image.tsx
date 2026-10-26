import { getGuide } from "@/lib/guides";
import { renderGuideOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

const guide = getGuide("url-encode-string")!;

export const alt = guide.ogTitle;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderGuideOgImage(guide);
}
