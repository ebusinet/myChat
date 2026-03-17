import type {
  ChatMessage,
  ChatSession,
  CreateSessionParams,
  EditMessageParams,
  MyChatServerConfig,
  SendMessageParams,
} from '@mychat/shared';
import { createProvider } from '../providers/factory.js';
import { MemoryStorageAdapter } from '../storage/memory.js';
import { buildContextPrompt } from '../context/builder.js';

export interface ChatHandlers {
  createSession(
    userId: string,
    params: CreateSessionParams,
  ): Promise<ChatSession>;
  listSessions(userId: string): Promise<ChatSession[]>;
  deleteSession(sessionId: string): Promise<void>;
  sendMessage(
    userId: string,
    params: SendMessageParams,
  ): AsyncIterable<string>;
  editMessage(
    userId: string,
    params: EditMessageParams,
  ): AsyncIterable<string>;
  getSessionMessages(sessionId: string): Promise<ChatMessage[]>;
  getBranch(messageId: string): Promise<ChatMessage[]>;
  getChildren(messageId: string): Promise<ChatMessage[]>;
}

/**
 * Creates framework-agnostic chat handlers.
 * These are pure functions — the host app wires them into its own routes.
 */
export function createChatHandlers(config: MyChatServerConfig): ChatHandlers {
  const provider = createProvider(config.provider);
  const storage = config.storage ?? new MemoryStorageAdapter();

  return {
    async createSession(userId, params) {
      return storage.createSession(userId, params);
    },

    async listSessions(userId) {
      return storage.listSessions(userId);
    },

    async deleteSession(sessionId) {
      return storage.deleteSession(sessionId);
    },

    async *sendMessage(userId, params) {
      // 1. Save the user message
      const userMessage = await storage.addMessage({
        sessionId: params.sessionId,
        parentId: params.parentId,
        role: 'user',
        content: params.content,
      });

      yield formatSSE({
        type: 'message_created',
        message: userMessage,
      });

      // 2. Get the full branch (root → this message)
      const branch = await storage.getBranch(userMessage.id);

      // 3. Optionally enrich context
      let context = params.context;
      if (config.onContextEnrich) {
        context = await config.onContextEnrich(context);
      }

      // 4. Build system prompt from context
      const contextPrompt = buildContextPrompt(context);
      const systemPrompt = config.systemPrompt
        ? config.systemPrompt + (contextPrompt ? '\n\n' + contextPrompt : '')
        : contextPrompt || undefined;

      // 5. Stream the AI response
      let fullText = '';

      for await (const event of provider.chat({
        messages: branch,
        context,
        systemPrompt,
      })) {
        if (event.type === 'text_delta') {
          fullText += event.content;
          yield formatSSE(event);
        }
      }

      // 6. Save the complete assistant message
      const assistantMessage = await storage.addMessage({
        sessionId: params.sessionId,
        parentId: userMessage.id,
        role: 'assistant',
        content: fullText,
      });

      yield formatSSE({
        type: 'message_done',
        message: assistantMessage,
      });

      // 7. Post-response hook
      if (config.onResponse) {
        await config.onResponse(assistantMessage);
      }
    },

    async *editMessage(userId, params) {
      // 1. Get the original message to find its parentId
      const original = await storage.getMessage(params.originalMessageId);
      if (!original) {
        yield formatSSE({
          type: 'error',
          error: `Message not found: ${params.originalMessageId}`,
        });
        return;
      }

      // 2. Create a new branch from the same parent as the original
      const sendParams: SendMessageParams = {
        sessionId: params.sessionId,
        parentId: original.parentId,
        content: params.content,
        context: params.context,
      };

      // 3. Delegate to sendMessage
      yield* this.sendMessage(userId, sendParams);
    },

    async getSessionMessages(sessionId) {
      return storage.getSessionMessages(sessionId);
    },

    async getBranch(messageId) {
      return storage.getBranch(messageId);
    },

    async getChildren(messageId) {
      return storage.getChildren(messageId);
    },
  };
}

function formatSSE(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}
