// Providers
export { ChatProvider, ChatInstance } from './providers/ChatProvider.js';
export { ContextProvider } from './providers/ContextCollector.js';
export { AppContext } from './providers/AppContext.js';
export { UserContext } from './providers/UserContext.js';
export { SessionContext } from './providers/SessionContext.js';
export { PagesContext } from './providers/PagesContext.js';
export { PageContext } from './providers/PageContext.js';
export { WidgetContext } from './providers/WidgetContext.js';

// Components
export { ChatBubble } from './components/ChatBubble.js';
export { ChatWidget } from './components/ChatWidget.js';
export { ChatPanel } from './components/ChatPanel.js';
export { MessageList } from './components/MessageList.js';
export { MessageInput } from './components/MessageInput.js';
export { SessionList } from './components/SessionList.js';
export { BranchNavigator } from './components/BranchNavigator.js';

// Hooks
export { useChat } from './hooks/useChat.js';
export { useContextCollector } from './hooks/useContextCollector.js';

// Re-export relevant types from @mychat/shared
export type {
  ChatMessage,
  ChatSession,
  ChatBranch,
  MessageRole,
  SendMessageParams,
  EditMessageParams,
  CreateSessionParams,
  ChatStreamEvent,
  ContextLayer,
  ContextLayerType,
  ContextSnapshot,
  ContextScope,
  MyChatClientConfig,
  ChatLabels,
} from '@mychat/shared';

// Re-export provider types
export type { ChatContextValue, ChatInstanceProps } from './providers/ChatProvider.js';
export type { ContextCollectorValue } from './providers/ContextCollector.js';
export type { AppContextProps } from './providers/AppContext.js';
export type { UserContextProps } from './providers/UserContext.js';
export type { SessionContextProps } from './providers/SessionContext.js';
export type { PagesContextProps } from './providers/PagesContext.js';
export type { PageContextProps } from './providers/PageContext.js';
export type { WidgetContextProps } from './providers/WidgetContext.js';
export type { ChatWidgetProps } from './components/ChatWidget.js';
export type { BranchNavigatorProps } from './components/BranchNavigator.js';
