import { Footer } from "@/components/shared/Footer";

// Shared shell for every tool route. The footer is identical across tools, so it
// lives here and renders once per page instead of being copy-pasted into each.
export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
