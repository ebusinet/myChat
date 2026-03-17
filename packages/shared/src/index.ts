// Types
export type {
  ContextLayer,
  ContextLayerType,
  ContextSnapshot,
} from './types/context.js';

export type {
  ChatMessage,
  ChatSession,
  ChatBranch,
  MessageRole,
  SendMessageParams,
  EditMessageParams,
  CreateSessionParams,
  ChatStreamEvent,
} from './types/chat.js';

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
} from './types/provider.js';

export { isAgentCapable } from './types/provider.js';

export type { StorageAdapter } from './types/storage.js';

export type {
  MyChatServerConfig,
  MyChatClientConfig,
  ChatLabels,
} from './types/config.js';

export { defaultLabels } from './types/config.js';

// Schemas
export {
  contextLayerSchema,
  contextLayerTypeSchema,
  contextSnapshotSchema,
} from './schemas/context.schema.js';

export {
  sendMessageSchema,
  editMessageSchema,
  createSessionSchema,
} from './schemas/chat.schema.js';
