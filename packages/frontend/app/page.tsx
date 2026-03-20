export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold mb-4">
          🐾 CLAWD Agent Launcher
        </h1>
        <p className="text-xl max-w-2xl mx-auto" style={{ color: "var(--muted)" }}>
          The infrastructure layer for AI agents on Base.
          <br />
          Every API call burns CLAWD.
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <a
            href="/dashboard/"
            className="px-6 py-3 rounded-lg font-medium text-white"
            style={{ backgroundColor: "var(--primary)" }}
          >
            Get API Key
          </a>
          <a
            href="/docs/"
            className="px-6 py-3 rounded-lg font-medium border"
            style={{ borderColor: "var(--border)" }}
          >
            Read Docs
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FeatureCard
          emoji="🔀"
          title="LLM Gateway"
          description="OpenAI-compatible /v1/chat/completions endpoint. Route to Gemini, Claude, and GPT through a single API."
        />
        <FeatureCard
          emoji="⌨️"
          title="CLI"
          description="Chat with models, manage API keys, and monitor usage from the command line."
        />
        <FeatureCard
          emoji="📦"
          title="x402 SDK"
          description="TypeScript SDK for seamless integration. Drop-in replacement for the OpenAI SDK."
        />
        <FeatureCard
          emoji="🔥"
          title="Burn Mechanism"
          description="Every token processed burns CLAWD. Input: 1 CLAWD/token. Output: 3 CLAWD/token."
        />
      </section>

      {/* How It Works */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StepCard
            step="1"
            title="Get an API Key"
            description="Create an API key linked to your Ethereum wallet address."
          />
          <StepCard
            step="2"
            title="Make API Calls"
            description="Send requests to the LLM Gateway using the OpenAI-compatible format."
          />
          <StepCard
            step="3"
            title="CLAWD Burns"
            description="Every request burns CLAWD tokens proportional to token usage. Deflationary by design."
          />
        </div>
      </section>

      {/* Supported Models */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-center">Supported Models</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th className="text-left py-3 px-4">Model</th>
                <th className="text-left py-3 px-4">Provider</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Burn Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="py-3 px-4 font-mono text-sm">gemini-2.0-flash</td>
                <td className="py-3 px-4">Google</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </td>
                <td className="py-3 px-4 text-sm">1 in / 3 out CLAWD/token</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="py-3 px-4 font-mono text-sm">claude-sonnet-4-5</td>
                <td className="py-3 px-4">Anthropic</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    Phase 2
                  </span>
                </td>
                <td className="py-3 px-4 text-sm">—</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono text-sm">gpt-4o</td>
                <td className="py-3 px-4">OpenAI</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    Phase 2
                  </span>
                </td>
                <td className="py-3 px-4 text-sm">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Quick Start */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-center">Quick Start</h2>
        <div
          className="rounded-lg p-6 font-mono text-sm overflow-x-auto"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <pre>{`npm install @clawd/x402-sdk

import { ClawdGateway } from '@clawd/x402-sdk';

const gateway = new ClawdGateway({ apiKey: 'your-key' });

const response = await gateway.chat.completions({
  model: 'gemini-2.0-flash',
  messages: [{ role: 'user', content: 'Hello!' }]
});

console.log(response.choices[0].message.content);
console.log('CLAWD burned:', response.clawd.burned);`}</pre>
        </div>
      </section>

      {/* CLAWD Token */}
      <section className="text-center py-8">
        <h2 className="text-3xl font-bold mb-4">CLAWD Token</h2>
        <p style={{ color: "var(--muted)" }} className="mb-4">
          Base (Chain 8453)
        </p>
        <code
          className="px-4 py-2 rounded text-sm"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07
        </code>
      </section>
    </div>
  );
}

function FeatureCard({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className="rounded-lg p-6"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="text-3xl mb-3">{emoji}</div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        {description}
      </p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4"
        style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
      >
        {step}
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        {description}
      </p>
    </div>
  );
}
