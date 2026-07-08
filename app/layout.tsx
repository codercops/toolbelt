import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { JetBrains_Mono, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/shared/Header";
import { ToastProvider } from "@/components/shared/Toast";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { CommandPaletteProvider } from "@/components/shared/CommandPalette";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex-mono",
  weight: ["400", "500", "600", "700"],
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex-sans",
  weight: ["300", "400", "500", "600", "700"],
});

// Runs synchronously before first paint so the correct theme is applied with no
// flash. Reads the saved choice, then falls back to the OS preference.
const THEME_INIT = `(function(){try{var t=localStorage.getItem("cc:theme");if(t!=="dark"&&t!=="light"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}var d=document.documentElement;d.setAttribute("data-theme",t);d.style.colorScheme=t;}catch(e){}})();`;

// Non-production deployments (Vercel previews and the develop staging domain)
// are marked noindex so they never get crawled or compete with production.
const IS_NON_PROD = Boolean(process.env.VERCEL_ENV) && process.env.VERCEL_ENV !== "production";

export const metadata: Metadata = {
  metadataBase: new URL("https://tools.codercops.com"),
  title: {
    default: "CODERCOPS Tools — Developer Utilities",
    template: "%s",
  },
  description:
    "Free, fast, privacy-first developer tools: JSON formatter, JWT decoder, Base64 encoder, and more. Runs entirely in your browser.",
  applicationName: "CODERCOPS Tools",
  authors: [{ name: "CODERCOPS", url: "https://www.codercops.com" }],
  ...(IS_NON_PROD ? { robots: { index: false, follow: false } } : {}),
  openGraph: {
    type: "website",
    siteName: "CODERCOPS Tools",
    url: "https://tools.codercops.com",
    locale: "en_US",
    title: "CODERCOPS Tools — Developer Utilities",
    description:
      "Free, fast, privacy-first developer tools: JSON formatter, JWT decoder, Base64 encoder, and more. Runs entirely in your browser.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@codercops",
    creator: "@codercops",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0A0B0F" },
    { media: "(prefers-color-scheme: light)", color: "#F6F5F0" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = headers().get("x-nonce") ?? undefined;
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jetbrains.variable} ${plexMono.variable} ${plexSans.variable}`}
      data-theme="dark"
    >
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[90] focus:px-3 focus:py-2 focus:rounded focus:bg-[var(--bg-raise)] focus:text-[var(--fg)] focus:outline-[var(--cyan)]"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <ToastProvider>
            <CommandPaletteProvider>
              <Header />
              <main id="main-content" className="flex-1 flex flex-col">
                {children}
              </main>
            </CommandPaletteProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
