import { useState } from 'react';
import { useChat } from '../hooks/useChat.js';
import { ChatPanel } from './ChatPanel.js';

export function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const { config } = useChat();

  const position = config.bubblePosition ?? 'bottom-right';

  return (
    <div className={`mychat-bubble-container mychat-bubble-${position}`}>
      {isOpen && (
        <div className="mychat-bubble-panel">
          <ChatPanel />
        </div>
      )}
      <button
        className={`mychat-bubble-btn ${isOpen ? 'mychat-bubble-btn-open' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
