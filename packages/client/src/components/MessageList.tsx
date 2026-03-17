import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@mychat/shared';
import { useChat } from '../hooks/useChat.js';
import { BranchNavigator } from './BranchNavigator.js';

export function MessageList() {
  const { messages, isStreaming, getBranchOptions, switchBranch, editMessage, labels } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [branchMap, setBranchMap] = useState<Map<string, ChatMessage[]>>(new Map());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Auto-scroll to bottom on new messages or streaming updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Load branch options for messages that may have siblings
  useEffect(() => {
    let cancelled = false;

    async function loadBranches() {
      const newMap = new Map<string, ChatMessage[]>();
      for (const msg of messages) {
        const siblings = await getBranchOptions(msg.id);
        if (siblings.length > 1) {
          newMap.set(msg.id, siblings);
        }
      }
      if (!cancelled) setBranchMap(newMap);
    }

    void loadBranches();
    return () => { cancelled = true; };
  }, [messages, getBranchOptions]);

  const handleEdit = useCallback((msg: ChatMessage) => {
    setEditingId(msg.id);
    setEditValue(msg.content);
  }, []);

  const handleEditSubmit = useCallback(async (messageId: string) => {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    setEditingId(null);
    await editMessage(messageId, trimmed);
  }, [editValue, editMessage]);

  const handleEditCancel = useCallback(() => {
    setEditingId(null);
    setEditValue('');
  }, []);

  const formatTime = useCallback((iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }, []);

  return (
    <div className="mychat-message-list">
      {messages.map((msg, idx) => {
        const isLast = idx === messages.length - 1;
        const siblings = branchMap.get(msg.id);
        const isEditing = editingId === msg.id;

        return (
          <div key={msg.id} className={`mychat-message mychat-message-${msg.role}`}>
            <div className="mychat-message-header">
              <span className="mychat-message-role">
                {msg.role === 'user' ? 'You' : 'AI'}
              </span>
              <span className="mychat-message-time">{formatTime(msg.createdAt)}</span>
            </div>

            {isEditing ? (
              <div className="mychat-message-edit">
                <textarea
                  className="mychat-edit-textarea"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  rows={3}
                />
                <div className="mychat-edit-actions">
                  <button
                    className="mychat-edit-save"
                    onClick={() => void handleEditSubmit(msg.id)}
                  >
                    Save
                  </button>
                  <button className="mychat-edit-cancel" onClick={handleEditCancel}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mychat-message-content">
                {msg.content}
                {isLast && isStreaming && msg.role === 'assistant' && (
                  <span className="mychat-streaming-indicator">{labels.thinking}</span>
                )}
              </div>
            )}

            <div className="mychat-message-footer">
              {msg.role === 'user' && !isEditing && (
                <button className="mychat-edit-btn" onClick={() => handleEdit(msg)}>
                  Edit
                </button>
              )}
              {siblings && (
                <BranchNavigator
                  siblings={siblings}
                  activeId={msg.id}
                  onSwitch={(id) => void switchBranch(id)}
                />
              )}
            </div>
          </div>
        );
      })}

      {messages.length === 0 && !isStreaming && (
        <div className="mychat-empty-state">
          Start a conversation by typing a message below.
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
