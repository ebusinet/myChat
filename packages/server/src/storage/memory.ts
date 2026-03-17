import type {
  ChatMessage,
  ChatSession,
  CreateSessionParams,
  StorageAdapter,
} from '@mychat/shared';

/**
 * In-memory StorageAdapter using Maps.
 * Suitable for development, testing, or single-process deployments
 * where persistence across restarts is not needed.
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private sessions = new Map<string, ChatSession & { userId: string }>();
  private messages = new Map<string, ChatMessage>();
  private sessionMessages = new Map<string, string[]>();

  // -- Sessions --

  async createSession(
    userId: string,
    params: CreateSessionParams,
  ): Promise<ChatSession> {
    const now = new Date().toISOString();
    const session: ChatSession & { userId: string } = {
      id: crypto.randomUUID(),
      userId,
      title: params.title ?? 'New conversation',
      contextSnapshot: params.context ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.sessions.set(session.id, session);
    this.sessionMessages.set(session.id, []);
    return toPublicSession(session);
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    const s = this.sessions.get(sessionId);
    return s ? toPublicSession(s) : null;
  }

  async listSessions(userId: string): Promise<ChatSession[]> {
    const results: ChatSession[] = [];
    for (const s of this.sessions.values()) {
      if (s.userId === userId) {
        results.push(toPublicSession(s));
      }
    }
    return results.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  async updateSessionTitle(
    sessionId: string,
    title: string,
  ): Promise<ChatSession> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);
    session.title = title;
    session.updatedAt = new Date().toISOString();
    return toPublicSession(session);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const msgIds = this.sessionMessages.get(sessionId) ?? [];
    for (const id of msgIds) {
      this.messages.delete(id);
    }
    this.sessionMessages.delete(sessionId);
    this.sessions.delete(sessionId);
  }

  // -- Messages --

  async addMessage(
    message: Omit<ChatMessage, 'id' | 'createdAt'>,
  ): Promise<ChatMessage> {
    const full: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.messages.set(full.id, full);

    const list = this.sessionMessages.get(full.sessionId);
    if (list) {
      list.push(full.id);
    } else {
      this.sessionMessages.set(full.sessionId, [full.id]);
    }

    // Update session timestamp
    const session = this.sessions.get(full.sessionId);
    if (session) {
      session.updatedAt = new Date().toISOString();
    }

    return full;
  }

  async getMessage(messageId: string): Promise<ChatMessage | null> {
    return this.messages.get(messageId) ?? null;
  }

  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    const ids = this.sessionMessages.get(sessionId) ?? [];
    const msgs: ChatMessage[] = [];
    for (const id of ids) {
      const m = this.messages.get(id);
      if (m) msgs.push(m);
    }
    return msgs.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  async getBranch(messageId: string): Promise<ChatMessage[]> {
    const branch: ChatMessage[] = [];
    let currentId: string | null = messageId;

    while (currentId) {
      const msg = this.messages.get(currentId);
      if (!msg) break;
      branch.unshift(msg);
      currentId = msg.parentId;
    }

    return branch;
  }

  async getChildren(messageId: string): Promise<ChatMessage[]> {
    const children: ChatMessage[] = [];
    for (const msg of this.messages.values()) {
      if (msg.parentId === messageId) {
        children.push(msg);
      }
    }
    return children.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }
}

function toPublicSession(
  s: ChatSession & { userId: string },
): ChatSession {
  const { userId: _, ...session } = s;
  return session;
}
