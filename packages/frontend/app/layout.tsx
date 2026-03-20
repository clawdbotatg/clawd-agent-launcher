import type { Metadata } from "next";
import "~/styles/globals.css";

export const metadata: Metadata = {
  title: "CLAWD Agent Launcher",
  description:
    "AI agent infrastructure powered by CLAWD — LLM Gateway, CLI, and x402 SDK",
  openGraph: {
    title: "CLAWD Agent Launcher",
    description:
      "AI agent infrastructure powered by CLAWD — LLM Gateway, CLI, and x402 SDK",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <nav className="border-b px-6 py-4" style={{ borderColor: "var(--border)" }}>
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a href="/" className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
              🐾 CLAWD
            </a>
            <div className="flex gap-6 text-sm">
              <a href="/">Home</a>
              <a href="/dashboard/">Dashboard</a>
              <a href="/docs/">Docs</a>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
        <footer
          className="border-t px-6 py-4 text-sm text-center"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
        >
          CLAWD Agent Launcher — every API call burns CLAWD
        </footer>
      </body>
    </html>
  );
}
