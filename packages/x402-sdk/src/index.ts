// @clawd/x402-sdk — TypeScript SDK for the CLAWD LLM Gateway

// ---- Types ----

export interface ClawdGatewayConfig {
  /** API key for authentication */
  apiKey: string;
  /** Gateway base URL (default: http://localhost:3001) */
  baseUrl?: string;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionChoice {
  index: number;
  message: {
    role: "assistant";
    content: string;
  };
  finish_reason: string;
}

export interface ChatCompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ClawdBurnInfo {
  burned: number;
  total_burned: string;
}

export interface ChatCompletionResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: ChatCompletionUsage;
  clawd: ClawdBurnInfo;
}

export interface ModelInfo {
  id: string;
  object: "model";
  created: number;
  owned_by: string;
  status: string;
  burn_rate?: {
    input: number;
    output: number;
    unit: string;
  };
}

export interface ModelsListResponse {
  object: "list";
  data: ModelInfo[];
}

export interface ApiKeyCreateResponse {
  apiKey: string;
  address: string;
  message: string;
}

export interface ApiKeyStatusResponse {
  apiKey: string;
  address: string;
  burnedAmount: string;
  totalTokensUsed: number;
  createdAt: string;
  burnRate: {
    input: string;
    output: string;
  };
}

export interface GatewayError {
  error: {
    message: string;
    type: string;
    code: string;
  };
}

// ---- SDK ----

export class ClawdGateway {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  public chat: {
    completions: (
      request: Omit<ChatCompletionRequest, "stream">
    ) => Promise<ChatCompletionResponse>;
  };

  public models: {
    list: () => Promise<ModelsListResponse>;
  };

  public keys: {
    status: (key?: string) => Promise<ApiKeyStatusResponse>;
  };

  constructor(config: ClawdGatewayConfig) {
    if (!config.apiKey) {
      throw new Error("apiKey is required");
    }

    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || "http://localhost:3001").replace(
      /\/$/,
      ""
    );
    this.timeout = config.timeout || 30000;

    // Bind methods
    this.chat = {
      completions: this.chatCompletions.bind(this),
    };

    this.models = {
      list: this.listModels.bind(this),
    };

    this.keys = {
      status: this.keyStatus.bind(this),
    };
  }

  // ---- Internal fetch ----

  private async request<T>(
    path: string,
    options: {
      method?: string;
      body?: unknown;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as GatewayError;
        throw new ClawdGatewayError(
          errorData.error?.message || `HTTP ${response.status}`,
          errorData.error?.type || "api_error",
          errorData.error?.code || "unknown",
          response.status
        );
      }

      return data as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ---- Chat Completions ----

  private async chatCompletions(
    request: Omit<ChatCompletionRequest, "stream">
  ): Promise<ChatCompletionResponse> {
    return this.request<ChatCompletionResponse>(
      "/api/v1/chat/completions",
      {
        method: "POST",
        body: { ...request, stream: false },
      }
    );
  }

  // ---- Models ----

  private async listModels(): Promise<ModelsListResponse> {
    return this.request<ModelsListResponse>("/api/v1/chat/completions");
  }

  // ---- Keys ----

  private async keyStatus(key?: string): Promise<ApiKeyStatusResponse> {
    const queryKey = key || this.apiKey;
    return this.request<ApiKeyStatusResponse>(
      `/api/keys/status?key=${encodeURIComponent(queryKey)}`
    );
  }
}

// ---- Error Class ----

export class ClawdGatewayError extends Error {
  public type: string;
  public code: string;
  public status: number;

  constructor(message: string, type: string, code: string, status: number) {
    super(message);
    this.name = "ClawdGatewayError";
    this.type = type;
    this.code = code;
    this.status = status;
  }
}

// Default export
export default ClawdGateway;
