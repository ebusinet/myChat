import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  ChatMessage,
  ChatSession,
  ChatStreamEvent,
  ContextLayer,
  ContextSnapshot,
  MyChatClientConfig,
  ChatLabels,
} from '@mychat/shared';
import { defaultLabels } from '@mychat/shared';
import { ContextCollector } from './ContextCollector.js';
import { useContextCollector } from '../hooks/useContextCollector.js';

export interface ChatContextValue {
  sessions: ChatSession[];
  activeSession: ChatSession | null;
  messages: ChatMessage[]; // current branch only (linear)
  isStreaming: boolean;

  createSession(): Promise<string>;
  switchSession(sessionId: string): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;

  sendMessage(content: string): Promise<void>;
  editMessage(messageId: string, newContent: string): Promise<void>;

  getBranchOptions(messageId: string): Promise<ChatMessage[]>;
  switchBranch(messageId: string): Promise<void>;

  contextLayers: ContextLayer[];
  labels: ChatLabels;
  config: MyChatClientConfig;
}

export const ChatContext = createContext<ChatContextValue | null>(null);

export interface ChatProviderProps {
  config: MyChatClientConfig;
  children: ReactNode;
}

export function ChatProvider({ config, children }: ChatProviderProps) {
  return (
    <ContextCollector>
      <ChatProviderInner config={config}>
        {children}
      </ChatProviderInner>
    </ContextCollector>
  );
}

// ---------------------------------------------------------------------------
// Internal provider that consumes the ContextCollector
// ---------------------------------------------------------------------------

function ChatProviderInner({ config, children }: ChatProviderProps) {
  const contextCollector = useContextCollector();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [allMessages, setAllMessages] = useState<Map<string, ChatMessage[]>>(new Map());
  const [activeBranchLeafId, setActiveBranchLeafId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const labels = useMemo<ChatLabels>(() => ({
    ...defaultLabels,
    ...config.labels,
  }), [config.labels]);

  // ---- Helpers ----

  const getAuthHeaders = useCallback(async (): Promise<HeadersInit> => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (config.getAuthToken) {
      const token = await config.getAuthToken();
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }, [config]);

  const apiUrl = useCallback((path: string) => {
    const base = config.serverUrl.replace(/\/$/, '');
    return `${base}${path}`;
  }, [config.serverUrl]);

  // ---- Build linear branch from message tree ----

  const buildBranch = useCallback((sessionMessages: ChatMessage[], leafId: string | null): ChatMessage[] => {
    if (!leafId || sessionMessages.length === 0) return [];

    const byId = new Map<string, ChatMessage>();
    for (const msg of sessionMessages) {
      byId.set(msg.id, msg);
    }

    const branch: ChatMessage[] = [];
    let current = byId.get(leafId);
    while (current) {
      branch.unshift(current);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    return branch;
  }, []);

  const findLatestLeaf = useCallback((sessionMessages: ChatMessage[]): string | null => {
    if (sessionMessages.length === 0) return null;

    const hasChild = new Set<string>();
    for (const msg of sessionMessages) {
      if (msg.parentId) hasChild.add(msg.parentId);
    }

    // Leaves are messages that have no children
    const leaves = sessionMessages.filter(m => !hasChild.has(m.id));
    if (leaves.length === 0) return null;

    // Pick the most recent leaf
    leaves.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return leaves[0]!.id;
  }, []);

  // ---- Derived state ----

  const activeSession = useMemo(
    () => sessions.find(s => s.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  );

  const sessionMessages = useMemo(
    () => (activeSessionId ? allMessages.get(activeSessionId) ?? [] : []),
    [allMessages, activeSessionId],
  );

  const messages = useMemo(
    () => buildBranch(sessionMessages, activeBranchLeafId),
    [buildBranch, sessionMessages, activeBranchLeafId],
  );

  // Context layers are read on-demand, not reactively tracked.
  // This avoids infinite re-render loops with useSyncExternalStore.
  const contextLayers: ContextLayer[] = contextCollector.getSnapshot().layers;

  // ---- Fetch sessions on mount ----

  useEffect(() => {
    let cancelled = false;

    async function fetchSessions() {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(apiUrl('/sessions'), { headers });
        if (!res.ok) return;
        const data: ChatSession[] = await res.json();
        if (!cancelled) {
          setSessions(data);
        }
      } catch {
        // silently fail — server may not be ready
      }
    }

    void fetchSessions();
    return () => { cancelled = true; };
  }, [apiUrl, getAuthHeaders]);

  // ---- Session actions ----

  const createSession = useCallback(async (): Promise<string> => {
    const headers = await getAuthHeaders();
    const snapshot = contextCollector.getSnapshot();
    const res = await fetch(apiUrl('/sessions'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ context: snapshot }),
    });
    if (!res.ok) throw new Error('Failed to create session');
    const session: ChatSession = await res.json();
    setSessions(prev => [session, ...prev]);
    setActiveSessionId(session.id);
    setAllMessages(prev => new Map(prev).set(session.id, []));
    setActiveBranchLeafId(null);
    return session.id;
  }, [apiUrl, getAuthHeaders, contextCollector]);

  const switchSession = useCallback(async (sessionId: string) => {
    setActiveSessionId(sessionId);

    // Fetch messages for this session if not already cached
    if (!allMessages.has(sessionId)) {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(apiUrl(`/sessions/${sessionId}/messages`), { headers });
        if (res.ok) {
          const msgs: ChatMessage[] = await res.json();
          setAllMessages(prev => new Map(prev).set(sessionId, msgs));
          setActiveBranchLeafId(findLatestLeaf(msgs));
        }
      } catch {
        // ignore
      }
    } else {
      const msgs = allMessages.get(sessionId) ?? [];
      setActiveBranchLeafId(findLatestLeaf(msgs));
    }
  }, [allMessages, apiUrl, getAuthHeaders, findLatestLeaf]);

  const deleteSession = useCallback(async (sessionId: string) => {
    const headers = await getAuthHeaders();
    await fetch(apiUrl(`/sessions/${sessionId}`), { method: 'DELETE', headers });
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setActiveBranchLeafId(null);
    }
    setAllMessages(prev => {
      const next = new Map(prev);
      next.delete(sessionId);
      return next;
    });
  }, [apiUrl, getAuthHeaders, activeSessionId]);

  // ---- Streaming SSE helper ----

  const streamResponse = useCallback(async (
    url: string,
    body: Record<string, unknown>,
    onEvent: (event: ChatStreamEvent) => void,
  ) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const headers = await getAuthHeaders();
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok || !res.body) {
      throw new Error(`Stream request failed: ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);
          if (jsonStr === '[DONE]') return;
          try {
            const event = JSON.parse(jsonStr) as ChatStreamEvent;
            onEvent(event);
          } catch {
            // skip malformed JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }, [getAuthHeaders]);

  // ---- Message actions ----

  const sendMessage = useCallback(async (content: string) => {
    if (isStreaming) return;

    // Auto-create session if none exists
    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = await createSession();
    }

    const snapshot: ContextSnapshot = contextCollector.getSnapshot();
    const parentId = activeBranchLeafId;

    setIsStreaming(true);
    let assistantContent = '';
    let assistantMessage: ChatMessage | null = null;

    try {
      await streamResponse(
        apiUrl(`/sessions/${sessionId}/messages`),
        { sessionId, parentId, content, context: snapshot },
        (event) => {
          switch (event.type) {
            case 'message_created': {
              const msg = event.message;
              setAllMessages(prev => {
                const msgs = [...(prev.get(sessionId) ?? []), msg];
                return new Map(prev).set(sessionId, msgs);
              });
              if (msg.role === 'assistant') {
                assistantMessage = msg;
              }
              if (msg.role === 'user') {
                setActiveBranchLeafId(msg.id);
              }
              break;
            }
            case 'text_delta': {
              assistantContent += event.content;
              if (assistantMessage) {
                const updated = { ...assistantMessage, content: assistantContent };
                assistantMessage = updated;
                setAllMessages(prev => {
                  const msgs = (prev.get(sessionId) ?? []).map(m =>
                    m.id === updated.id ? updated : m,
                  );
                  return new Map(prev).set(sessionId, msgs);
                });
              }
              break;
            }
            case 'message_done': {
              const msg = event.message;
              assistantMessage = msg;
              setAllMessages(prev => {
                const msgs = (prev.get(sessionId) ?? []).map(m =>
                  m.id === msg.id ? msg : m,
                );
                return new Map(prev).set(sessionId, msgs);
              });
              setActiveBranchLeafId(msg.id);
              break;
            }
            case 'error': {
              console.error('[myChat] Stream error:', event.error);
              break;
            }
          }
        },
      );
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [activeSessionId, isStreaming, activeBranchLeafId, contextCollector, streamResponse, apiUrl, createSession]);

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!activeSessionId || isStreaming) return;

    const sessionId = activeSessionId;
    const snapshot: ContextSnapshot = contextCollector.getSnapshot();

    setIsStreaming(true);
    let assistantContent = '';
    let assistantMessage: ChatMessage | null = null;

    try {
      await streamResponse(
        apiUrl(`/sessions/${sessionId}/messages/edit`),
        { sessionId, originalMessageId: messageId, content: newContent, context: snapshot },
        (event) => {
          switch (event.type) {
            case 'message_created': {
              const msg = event.message;
              setAllMessages(prev => {
                const msgs = [...(prev.get(sessionId) ?? []), msg];
                return new Map(prev).set(sessionId, msgs);
              });
              if (msg.role === 'assistant') {
                assistantMessage = msg;
              }
              if (msg.role === 'user') {
                setActiveBranchLeafId(msg.id);
              }
              break;
            }
            case 'text_delta': {
              assistantContent += event.content;
              if (assistantMessage) {
                const updated = { ...assistantMessage, content: assistantContent };
                assistantMessage = updated;
                setAllMessages(prev => {
                  const msgs = (prev.get(sessionId) ?? []).map(m =>
                    m.id === updated.id ? updated : m,
                  );
                  return new Map(prev).set(sessionId, msgs);
                });
              }
              break;
            }
            case 'message_done': {
              const msg = event.message;
              assistantMessage = msg;
              setAllMessages(prev => {
                const msgs = (prev.get(sessionId) ?? []).map(m =>
                  m.id === msg.id ? msg : m,
                );
                return new Map(prev).set(sessionId, msgs);
              });
              setActiveBranchLeafId(msg.id);
              break;
            }
            case 'error': {
              console.error('[myChat] Edit stream error:', event.error);
              break;
            }
          }
        },
      );
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [activeSessionId, isStreaming, contextCollector, streamResponse, apiUrl]);

  // ---- Branch navigation ----

  const getBranchOptions = useCallback(async (messageId: string): Promise<ChatMessage[]> => {
    // Find the parent of this message, then return all siblings
    const msg = sessionMessages.find(m => m.id === messageId);
    if (!msg) return [];

    return sessionMessages.filter(m => m.parentId === msg.parentId);
  }, [sessionMessages]);

  const switchBranch = useCallback(async (messageId: string) => {
    // Find the latest leaf descending from this message
    const descendants = new Map<string, ChatMessage[]>();
    for (const msg of sessionMessages) {
      if (msg.parentId) {
        const children = descendants.get(msg.parentId) ?? [];
        children.push(msg);
        descendants.set(msg.parentId, children);
      }
    }

    // Walk down to find the deepest descendant (prefer most recent at each level)
    let currentId = messageId;
    while (true) {
      const children = descendants.get(currentId);
      if (!children || children.length === 0) break;
      children.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      currentId = children[0]!.id;
    }

    setActiveBranchLeafId(currentId);
  }, [sessionMessages]);

  // ---- Context value ----

  const value = useMemo<ChatContextValue>(() => ({
    sessions,
    activeSession,
    messages,
    isStreaming,
    createSession,
    switchSession,
    deleteSession,
    sendMessage,
    editMessage,
    getBranchOptions,
    switchBranch,
    contextLayers,
    labels,
    config,
  }), [
    sessions, activeSession, messages, isStreaming,
    createSession, switchSession, deleteSession,
    sendMessage, editMessage,
    getBranchOptions, switchBranch,
    contextLayers, labels, config,
  ]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}
