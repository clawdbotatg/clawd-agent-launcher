export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h1>🐾 CLAWD LLM Gateway</h1>
      <p>OpenAI-compatible API — every call burns CLAWD.</p>
      <h2>Endpoints</h2>
      <ul>
        <li>
          <code>POST /api/v1/chat/completions</code> — Chat completions
        </li>
        <li>
          <code>GET /api/v1/chat/completions</code> — List models
        </li>
        <li>
          <code>POST /api/keys/create</code> — Create API key
        </li>
        <li>
          <code>GET /api/keys/status?key=...</code> — Check key status
        </li>
      </ul>
      <h2>Supported Models (Phase 1)</h2>
      <ul>
        <li>
          <code>gemini-2.0-flash</code> — Google Gemini 2.0 Flash
        </li>
      </ul>
      <h2>Coming (Phase 2)</h2>
      <ul>
        <li>
          <code>claude-sonnet-4-5</code> — Anthropic Claude
        </li>
        <li>
          <code>gpt-4o</code> — OpenAI GPT-4o
        </li>
      </ul>
    </main>
  );
}
