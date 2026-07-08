import { renderHomeOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const alt = "CODERCOPS Tools — fast, privacy-first developer utilities";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return renderHomeOgImage();
}
