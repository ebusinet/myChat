import { useState } from 'react';
import { useChat } from '../hooks/useChat.js';
import { MessageList } from './MessageList.js';
import { MessageInput } from './MessageInput.js';
import { SessionList } from './SessionList.js';

export function ChatPanel() {
  const { activeSession, labels } = useChat();
  const [showSessions, setShowSessions] = useState(false);

  return (
    <div className="mychat-panel">
      <div className="mychat-header">
        <button
          className="mychat-sessions-toggle"
          onClick={() => setShowSessions(prev => !prev)}
          aria-label={labels.sessions}
        >
          &#9776;
        </button>
        <span className="mychat-header-title">
          {activeSession?.title || 'myChat'}
        </span>
      </div>

      <div className="mychat-body">
        {showSessions && (
          <div className="mychat-sidebar">
            <SessionList />
          </div>
        )}
        <div className="mychat-main">
          <MessageList />
          <MessageInput />
        </div>
      </div>
    </div>
  );
}
