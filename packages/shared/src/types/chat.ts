import type { ContextSnapshot } from './context.js';

export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * A single message in the conversation tree.
 * Messages form a tree via parentId — each node can have multiple children (branches).
 */
export interface ChatMessage {
  id: string;
  sessionId: string;
  parentId: string | null;
  role: MessageRole;
  content: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * A conversation session with its metadata.
 * The actual messages form a tree (not a flat list).
 */
export interface ChatSession {
  id: string;
  title: string;
  contextSnapshot: ContextSnapshot | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * A branch in the conversation tree.
 * Represents the linear path from root to a specific leaf.
 */
export interface ChatBranch {
  leafMessageId: string;
  messages: ChatMessage[];
}

// -- API payloads --

export interface SendMessageParams {
  sessionId: string;
  parentId: string | null;
  content: string;
  context: ContextSnapshot;
}

export interface EditMessageParams {
  sessionId: string;
  originalMessageId: string;
  content: string;
  context: ContextSnapshot;
}

export interface CreateSessionParams {
  title?: string;
  context?: ContextSnapshot;
}

// -- Stream events --

export type ChatStreamEvent =
  | { type: 'text_delta'; content: string }
  | { type: 'message_created'; message: ChatMessage }
  | { type: 'message_done'; message: ChatMessage }
  | { type: 'error'; error: string };
