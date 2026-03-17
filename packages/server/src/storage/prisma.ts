import type {
  ChatMessage,
  ChatSession,
  CreateSessionParams,
  StorageAdapter,
} from '@mychat/shared';

/**
 * Any object that exposes Prisma-like model accessors.
 * This avoids requiring a generated PrismaClient at build time.
 */
type PrismaLike = Record<string, any>;

/**
 * StorageAdapter backed by Prisma.
 *
 * Assumes these Prisma models exist:
 * - ChatSession: id, userId, title, contextSnapshot (Json), createdAt, updatedAt
 * - ChatMessage: id, sessionId, parentId, role, content, createdAt, metadata (Json)
 */
export class PrismaStorageAdapter implements StorageAdapter {
  private prisma: PrismaLike;

  constructor(prisma: PrismaLike) {
    this.prisma = prisma;
  }

  // -- Sessions --

  async createSession(
    userId: string,
    params: CreateSessionParams,
  ): Promise<ChatSession> {
    const row = await this.prisma.chatSession.create({
      data: {
        userId,
        title: params.title ?? 'New conversation',
        contextSnapshot: params.context ?? undefined,
      },
    });
    return toChatSession(row);
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    const row = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });
    return row ? toChatSession(row) : null;
  }

  async listSessions(userId: string): Promise<ChatSession[]> {
    const rows = await this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map(toChatSession);
  }

  async updateSessionTitle(
    sessionId: string,
    title: string,
  ): Promise<ChatSession> {
    const row = await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { title },
    });
    return toChatSession(row);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.prisma.chatMessage.deleteMany({
      where: { sessionId },
    });
    await this.prisma.chatSession.delete({
      where: { id: sessionId },
    });
  }

  // -- Messages --

  async addMessage(
    message: Omit<ChatMessage, 'id' | 'createdAt'>,
  ): Promise<ChatMessage> {
    const row = await this.prisma.chatMessage.create({
      data: {
        sessionId: message.sessionId,
        parentId: message.parentId,
        role: message.role,
        content: message.content,
        metadata: message.metadata ?? undefined,
      },
    });

    // Touch session updatedAt
    await this.prisma.chatSession.update({
      where: { id: message.sessionId },
      data: { updatedAt: new Date() },
    });

    return toChatMessage(row);
  }

  async getMessage(messageId: string): Promise<ChatMessage | null> {
    const row = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });
    return row ? toChatMessage(row) : null;
  }

  async getSessionMessages(
    sessionId: string,
  ): Promise<ChatMessage[]> {
    const rows = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toChatMessage);
  }

  async getBranch(messageId: string): Promise<ChatMessage[]> {
    const branch: ChatMessage[] = [];
    let currentId: string | null = messageId;

    while (currentId) {
      const row: any = await this.prisma.chatMessage.findUnique({
        where: { id: currentId },
      });
      if (!row) break;
      branch.unshift(toChatMessage(row));
      currentId = row.parentId;
    }

    return branch;
  }

  async getChildren(messageId: string): Promise<ChatMessage[]> {
    const rows = await this.prisma.chatMessage.findMany({
      where: { parentId: messageId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toChatMessage);
  }
}

// -- Row mappers --

function toChatSession(row: any): ChatSession {
  return {
    id: row.id,
    title: row.title,
    contextSnapshot: row.contextSnapshot ?? null,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : row.createdAt,
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : row.updatedAt,
  };
}

function toChatMessage(row: any): ChatMessage {
  return {
    id: row.id,
    sessionId: row.sessionId,
    parentId: row.parentId ?? null,
    role: row.role,
    content: row.content,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : row.createdAt,
    metadata: row.metadata ?? undefined,
  };
}
