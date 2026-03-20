export const metadata = {
  title: "CLAWD LLM Gateway",
  description: "OpenAI-compatible LLM Gateway powered by CLAWD",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
