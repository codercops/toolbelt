"use client";

import { useEffect } from "react";

// Catches errors in the root layout itself. Must render its own <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" data-theme="dark">
      <body
        style={{
          background: "#0A0B0F",
          color: "#E8E6E1",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: 420 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
            The app failed to load
          </h1>
          <p style={{ color: "#8289A0", fontSize: 14, marginBottom: 24 }}>
            A critical error occurred. Please reload the page.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid rgba(0,229,199,0.35)",
              background: "rgba(0,229,199,0.14)",
              color: "#00E5C7",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
