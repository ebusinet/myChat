import type { ProviderConfig } from './provider.js';
import type { StorageAdapter } from './storage.js';

/**
 * Server-side configuration for myChat.
 */
export interface MyChatServerConfig {
  /** AI provider configuration */
  provider: ProviderConfig;

  /** Optional fallback providers (tried in order if primary fails) */
  fallbackProviders?: ProviderConfig[];

  /** Storage adapter (defaults to MemoryStorageAdapter) */
  storage?: StorageAdapter;

  /** Custom system prompt prepended to all conversations */
  systemPrompt?: string;

  /**
   * Hook to transform/enrich context before sending to the AI.
   * Useful for adding server-side data the client doesn't have.
   */
  onContextEnrich?: (context: import('./context.js').ContextSnapshot) => Promise<import('./context.js').ContextSnapshot>;

  /**
   * Hook called after each AI response.
   * Useful for logging, analytics, or post-processing.
   */
  onResponse?: (message: import('./chat.js').ChatMessage) => Promise<void>;
}

/**
 * Client-side configuration for myChat.
 */
export interface MyChatClientConfig {
  /** Server endpoint URL (e.g., '/api/chat' or 'https://api.example.com/chat') */
  serverUrl: string;

  /** Display mode: 'bubble' (floating button), 'widget' (inline panel), 'embedded' (bare panel) */
  mode?: 'bubble' | 'widget' | 'embedded';

  /** Position for bubble mode */
  bubblePosition?: 'bottom-right' | 'bottom-left';

  /** Auth token or function that returns one (delegated from host app) */
  getAuthToken?: () => string | Promise<string>;

  /** Custom labels / i18n */
  labels?: Partial<ChatLabels>;
}

export interface ChatLabels {
  placeholder: string;
  sendButton: string;
  newSession: string;
  sessions: string;
  thinking: string;
}

export const defaultLabels: ChatLabels = {
  placeholder: 'Ask a question...',
  sendButton: 'Send',
  newSession: 'New conversation',
  sessions: 'Conversations',
  thinking: 'Thinking...',
};
