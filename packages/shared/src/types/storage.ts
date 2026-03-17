import type { ChatMessage, ChatSession, CreateSessionParams } from './chat.js';

/**
 * Storage adapter interface.
 * Implement this to persist conversations in any backend.
 *
 * Two built-in adapters:
 * - MemoryStorageAdapter  (default, no persistence)
 * - PrismaStorageAdapter  (PostgreSQL via Prisma)
 */
export interface StorageAdapter {
  // -- Sessions --
  createSession(userId: string, params: CreateSessionParams): Promise<ChatSession>;
  getSession(sessionId: string): Promise<ChatSession | null>;
  listSessions(userId: string): Promise<ChatSession[]>;
  updateSessionTitle(sessionId: string, title: string): Promise<ChatSession>;
  deleteSession(sessionId: string): Promise<void>;

  // -- Messages --
  addMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage>;
  getMessage(messageId: string): Promise<ChatMessage | null>;
  getSessionMessages(sessionId: string): Promise<ChatMessage[]>;

  /**
   * Walk up the tree from a message to the root, returning the full branch.
   * This is the message chain sent to the AI provider.
   */
  getBranch(messageId: string): Promise<ChatMessage[]>;

  /**
   * Get direct children of a message (for branch navigation).
   */
  getChildren(messageId: string): Promise<ChatMessage[]>;
}
