export { createChatHandlers } from './handlers/index.js';
export type { ChatHandlers } from './handlers/index.js';

export { createProvider } from './providers/factory.js';
export { AnthropicProvider } from './providers/anthropic.js';
export { OpenAIProvider } from './providers/openai.js';
export { GeminiProvider } from './providers/gemini.js';
export { ClaudeAgentProvider } from './providers/claude-agent.js';

export { MemoryStorageAdapter } from './storage/memory.js';

export { buildContextPrompt } from './context/builder.js';

// Re-export shared types used by host apps
export type {
  AIProvider,
  AgentCapableProvider,
  AgentSessionHandle,
  ChatParams,
  ProviderConfig,
  AnthropicProviderConfig,
  OpenAIProviderConfig,
  GeminiProviderConfig,
  ClaudeAgentProviderConfig,
  StorageAdapter,
  MyChatServerConfig,
  ChatMessage,
  ChatSession,
  ChatBranch,
  ChatStreamEvent,
  SendMessageParams,
  EditMessageParams,
  CreateSessionParams,
  ContextSnapshot,
  ContextLayer,
} from '@mychat/shared';

export { isAgentCapable } from '@mychat/shared';
