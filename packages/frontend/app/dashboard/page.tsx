"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface KeyStatus {
  apiKey: string;
  address: string;
  burnedAmount: string;
  totalTokensUsed: number;
  createdAt: string;
}

export default function Dashboard() {
  const [address, setAddress] = useState("");
  const [gatewaySecret, setGatewaySecret] = useState("");
  const [newKey, setNewKey] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [checkKey, setCheckKey] = useState("");
  const [keyStatus, setKeyStatus] = useState<KeyStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState("");

  async function handleCreateKey() {
    setCreateError("");
    setNewKey("");

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setCreateError("Please enter a valid Ethereum address (0x...)");
      return;
    }

    setIsCreating(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (gatewaySecret) {
        headers["x-gateway-secret"] = gatewaySecret;
      }

      const res = await fetch(`${API_URL}/api/keys/create`, {
        method: "POST",
        headers,
        body: JSON.stringify({ address }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Failed to create key");
        return;
      }

      setNewKey(data.apiKey);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleCheckStatus() {
    setCheckError("");
    setKeyStatus(null);

    if (!checkKey) {
      setCheckError("Please enter an API key");
      return;
    }

    setIsChecking(true);
    try {
      const res = await fetch(
        `${API_URL}/api/keys/status?key=${encodeURIComponent(checkKey)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setCheckError(data.error || "Key not found");
        return;
      }
      setKeyStatus(data);
    } catch (err) {
      setCheckError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="space-y-12">
      <section className="text-center">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p style={{ color: "var(--muted)" }}>
          Create API keys and monitor usage
        </p>
      </section>

      {/* Create Key */}
      <section
        className="rounded-lg p-6"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <h2 className="text-xl font-bold mb-4">Create API Key</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Wallet Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: "var(--background)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Gateway Secret (optional)
            </label>
            <input
              type="password"
              value={gatewaySecret}
              onChange={(e) => setGatewaySecret(e.target.value)}
              placeholder="Gateway secret"
              className="w-full px-4 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: "var(--background)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>
          <button
            onClick={handleCreateKey}
            disabled={isCreating}
            className="px-6 py-2 rounded-lg font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--primary)" }}
          >
            {isCreating ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating...
              </>
            ) : (
              "Create Key"
            )}
          </button>

          {createError && (
            <div className="p-3 rounded-lg text-sm text-red-700 bg-red-50">
              {createError}
            </div>
          )}

          {newKey && (
            <div className="p-4 rounded-lg bg-green-50 text-green-800">
              <p className="font-bold mb-2">✅ API Key Created!</p>
              <code className="block p-2 bg-white rounded text-sm break-all">
                {newKey}
              </code>
              <p className="text-xs mt-2">
                Save this key — it won&apos;t be shown again.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Check Status */}
      <section
        className="rounded-lg p-6"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <h2 className="text-xl font-bold mb-4">Check Key Status</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">API Key</label>
            <input
              type="text"
              value={checkKey}
              onChange={(e) => setCheckKey(e.target.value)}
              placeholder="clawd-..."
              className="w-full px-4 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: "var(--background)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>
          <button
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="px-6 py-2 rounded-lg font-medium border disabled:opacity-50"
            style={{ borderColor: "var(--border)" }}
          >
            {isChecking ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Checking...
              </>
            ) : (
              "Check Status"
            )}
          </button>

          {checkError && (
            <div className="p-3 rounded-lg text-sm text-red-700 bg-red-50">
              {checkError}
            </div>
          )}

          {keyStatus && (
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: "var(--background)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span style={{ color: "var(--muted)" }}>API Key</span>
                  <p className="font-mono">{keyStatus.apiKey}</p>
                </div>
                <div>
                  <span style={{ color: "var(--muted)" }}>Address</span>
                  <p className="font-mono text-sm">{keyStatus.address}</p>
                </div>
                <div>
                  <span style={{ color: "var(--muted)" }}>🔥 CLAWD Burned</span>
                  <p className="text-2xl font-bold">{keyStatus.burnedAmount}</p>
                </div>
                <div>
                  <span style={{ color: "var(--muted)" }}>Tokens Used</span>
                  <p className="text-2xl font-bold">
                    {keyStatus.totalTokensUsed.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span style={{ color: "var(--muted)" }}>Created</span>
                  <p>{new Date(keyStatus.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
