"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ fontFamily: "Georgia, serif", background: "#fbf8f2", color: "#1f1b16", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontWeight: 500 }}>Something went wrong</h1>
          <p>Please try again in a moment.</p>
          <button type="button" onClick={reset} style={{ marginTop: 16, padding: "10px 20px", background: "#0e3b2e", color: "#fbf8f2", border: 0, cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
