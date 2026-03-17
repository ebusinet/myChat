import type { ContextSnapshot } from './context.js';
import type { ChatMessage, ChatStreamEvent } from './chat.js';

/**
 * Parameters for a standard chat call.
 */
export interface ChatParams {
  messages: ChatMessage[];
  context: ContextSnapshot;
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
}

/**
 * Base AI provider — implemented by all providers (Anthropic, OpenAI, Gemini).
 * Stateless: each call receives the full message history.
 */
export interface AIProvider {
  readonly name: string;
  chat(params: ChatParams): AsyncIterable<ChatStreamEvent>;
}

// ---------------------------------------------------------------------------
// Claude Agent SDK proxy (future integration)
// ---------------------------------------------------------------------------

/**
 * Handle for an active Agent SDK session.
 * Wraps the SDK's session management (resume/fork/continue).
 */
export interface AgentSessionHandle {
  readonly sessionId: string;
  send(message: string, context?: ContextSnapshot): AsyncIterable<ChatStreamEvent>;
  fork(): Promise<AgentSessionHandle>;
}

/**
 * Extended provider interface for agent-capable backends.
 * When enabled, the server can offer "agent mode" where the AI
 * can execute tools (read files, run code, etc.) in addition to chatting.
 *
 * This is a SUPERSET of AIProvider — it still supports standard chat,
 * but also exposes agent session management.
 */
export interface AgentCapableProvider extends AIProvider {
  readonly agentCapable: true;
  createAgentSession(context: ContextSnapshot): Promise<AgentSessionHandle>;
  resumeAgentSession(sessionId: string): Promise<AgentSessionHandle>;
}

/**
 * Type guard to check if a provider supports agent mode.
 */
export function isAgentCapable(provider: AIProvider): provider is AgentCapableProvider {
  return 'agentCapable' in provider && (provider as AgentCapableProvider).agentCapable === true;
}

// ---------------------------------------------------------------------------
// Provider configuration
// ---------------------------------------------------------------------------

export interface AnthropicProviderConfig {
  type: 'anthropic';
  apiKey: string;
  model?: string; // default: claude-sonnet-4-20250514
  maxTokens?: number;
}

export interface OpenAIProviderConfig {
  type: 'openai';
  apiKey: string;
  baseUrl?: string; // for proxies / compatible endpoints
  model?: string;
  maxTokens?: number;
}

export interface GeminiProviderConfig {
  type: 'gemini';
  apiKey: string;
  model?: string;
  maxTokens?: number;
}

export interface ClaudeAgentProviderConfig {
  type: 'claude-agent';
  // Configuration TBD when Agent SDK integration is implemented
  model?: string;
  allowedTools?: string[];
  permissionMode?: 'default' | 'plan' | 'acceptEdits';
}

export type ProviderConfig =
  | AnthropicProviderConfig
  | OpenAIProviderConfig
  | GeminiProviderConfig
  | ClaudeAgentProviderConfig;
