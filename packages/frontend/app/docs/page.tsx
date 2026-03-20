export default function Docs() {
  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      <section>
        <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
        <p style={{ color: "var(--muted)" }}>
          OpenAI-compatible LLM Gateway — drop-in replacement for the OpenAI
          SDK.
        </p>
      </section>

      {/* Authentication */}
      <DocSection title="Authentication">
        <p className="mb-4">
          All API requests require an API key sent via the{" "}
          <code className="px-1 py-0.5 rounded bg-gray-100 text-sm">
            Authorization
          </code>{" "}
          header.
        </p>
        <CodeBlock>
          {`Authorization: Bearer clawd-your-api-key-here`}
        </CodeBlock>
      </DocSection>

      {/* Chat Completions */}
      <DocSection title="POST /api/v1/chat/completions">
        <p className="mb-4">
          Send a chat completion request. Compatible with the OpenAI API format.
        </p>
        <h4 className="font-bold mt-4 mb-2">Request</h4>
        <CodeBlock>
          {`curl -X POST https://your-gateway.vercel.app/api/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer clawd-your-api-key" \\
  -d '{
    "model": "gemini-2.0-flash",
    "messages": [
      { "role": "system", "content": "You are a helpful assistant." },
      { "role": "user", "content": "Hello!" }
    ],
    "temperature": 0.7,
    "max_tokens": 1024
  }'`}
        </CodeBlock>

        <h4 className="font-bold mt-6 mb-2">Response</h4>
        <CodeBlock>
          {`{
  "id": "chatcmpl-clawd-1234567890",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gemini-2.0-flash",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 10,
    "total_tokens": 30
  },
  "clawd": {
    "burned": 50,
    "total_burned": "50"
  }
}`}
        </CodeBlock>

        <h4 className="font-bold mt-6 mb-2">CLAWD Burn Info</h4>
        <p className="mb-2">
          The response includes a <code className="px-1 py-0.5 rounded bg-gray-100 text-sm">clawd</code> object
          with burn information:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            <code className="px-1 py-0.5 rounded bg-gray-100">burned</code> — CLAWD burned for this request
          </li>
          <li>
            <code className="px-1 py-0.5 rounded bg-gray-100">total_burned</code> — Total CLAWD burned by this API key
          </li>
        </ul>
      </DocSection>

      {/* Models */}
      <DocSection title="GET /api/v1/chat/completions">
        <p className="mb-4">List available models and their status.</p>
        <CodeBlock>
          {`curl https://your-gateway.vercel.app/api/v1/chat/completions`}
        </CodeBlock>
      </DocSection>

      {/* Key Create */}
      <DocSection title="POST /api/keys/create">
        <p className="mb-4">
          Create a new API key linked to a wallet address.
        </p>
        <CodeBlock>
          {`curl -X POST https://your-gateway.vercel.app/api/keys/create \\
  -H "Content-Type: application/json" \\
  -H "x-gateway-secret: your-gateway-secret" \\
  -d '{ "address": "0x1234...5678" }'`}
        </CodeBlock>
        <h4 className="font-bold mt-4 mb-2">Response</h4>
        <CodeBlock>
          {`{
  "apiKey": "clawd-abc123...",
  "address": "0x1234...5678",
  "message": "API key created."
}`}
        </CodeBlock>
      </DocSection>

      {/* Key Status */}
      <DocSection title="GET /api/keys/status?key=...">
        <p className="mb-4">Check usage stats for an API key.</p>
        <CodeBlock>
          {`curl "https://your-gateway.vercel.app/api/keys/status?key=clawd-your-key"`}
        </CodeBlock>
      </DocSection>

      {/* SDK */}
      <DocSection title="TypeScript SDK (@clawd/x402-sdk)">
        <CodeBlock>
          {`import { ClawdGateway } from '@clawd/x402-sdk';

const gateway = new ClawdGateway({
  apiKey: 'clawd-your-key',
  baseUrl: 'https://your-gateway.vercel.app',
});

// Chat completions
const response = await gateway.chat.completions({
  model: 'gemini-2.0-flash',
  messages: [{ role: 'user', content: 'Hello!' }],
});

console.log(response.choices[0].message.content);
console.log('CLAWD burned:', response.clawd.burned);

// List models
const models = await gateway.models.list();

// Check key status
const status = await gateway.keys.status();`}
        </CodeBlock>
      </DocSection>

      {/* CLI */}
      <DocSection title="CLI (@clawd/cli)">
        <CodeBlock>
          {`# Install
npm install -g @clawd/cli

# Initialize
clawd init --gateway https://your-gateway.vercel.app --api-key clawd-your-key

# Chat
clawd chat "What is Ethereum?" --model gemini-2.0-flash

# Key management
clawd key create --address 0x1234...5678
clawd key status

# List models
clawd models`}
        </CodeBlock>
      </DocSection>

      {/* Burn Rates */}
      <DocSection title="Burn Rates">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th className="text-left py-2 px-4">Token Type</th>
                <th className="text-left py-2 px-4">CLAWD Burned</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="py-2 px-4">Input token</td>
                <td className="py-2 px-4">1 CLAWD</td>
              </tr>
              <tr>
                <td className="py-2 px-4">Output token</td>
                <td className="py-2 px-4">3 CLAWD</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
          Example: A request using 100 input tokens and 50 output tokens burns
          100 + (50 × 3) = 250 CLAWD.
        </p>
      </DocSection>
    </div>
  );
}

function DocSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-lg p-6"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      <h2 className="text-xl font-bold mb-4 font-mono">{title}</h2>
      {children}
    </section>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre
      className="rounded-lg p-4 text-sm overflow-x-auto"
      style={{
        backgroundColor: "var(--background)",
        border: "1px solid var(--border)",
      }}
    >
      <code>{children}</code>
    </pre>
  );
}
