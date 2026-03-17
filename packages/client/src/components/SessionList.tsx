import { useCallback } from 'react';
import { useChat } from '../hooks/useChat.js';

export function SessionList() {
  const { sessions, activeSession, createSession, switchSession, deleteSession, labels } = useChat();

  const formatDate = useCallback((iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }, []);

  return (
    <div className="mychat-session-list">
      <button
        className="mychat-new-session-btn"
        onClick={() => void createSession()}
      >
        + {labels.newSession}
      </button>

      <div className="mychat-session-items">
        {sessions.map(session => (
          <div
            key={session.id}
            className={`mychat-session-item ${activeSession?.id === session.id ? 'mychat-session-active' : ''}`}
            onClick={() => void switchSession(session.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') void switchSession(session.id); }}
          >
            <div className="mychat-session-info">
              <span className="mychat-session-title">{session.title || 'Untitled'}</span>
              <span className="mychat-session-date">{formatDate(session.updatedAt)}</span>
            </div>
            <button
              className="mychat-session-delete"
              onClick={(e) => {
                e.stopPropagation();
                void deleteSession(session.id);
              }}
              aria-label="Delete session"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
