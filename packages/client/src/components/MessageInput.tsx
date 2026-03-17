import { useCallback, useRef, useState, type KeyboardEvent } from 'react';
import { useChat } from '../hooks/useChat.js';

export function MessageInput() {
  const { sendMessage, isStreaming, contextLayers, labels } = useChat();
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const lineHeight = 24;
    const maxLines = 5;
    const maxHeight = lineHeight * maxLines;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await sendMessage(trimmed);
  }, [value, isStreaming, sendMessage]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }, [handleSend]);

  return (
    <div className="mychat-input-container">
      {contextLayers.length > 0 && (
        <div className="mychat-context-indicator">
          {contextLayers.length} context layer{contextLayers.length !== 1 ? 's' : ''}
        </div>
      )}
      <div className="mychat-input-row">
        <textarea
          ref={textareaRef}
          className="mychat-textarea"
          value={value}
          onChange={(e) => { setValue(e.target.value); adjustHeight(); }}
          onKeyDown={handleKeyDown}
          placeholder={labels.placeholder}
          disabled={isStreaming}
          rows={1}
        />
        <button
          className="mychat-send-btn"
          onClick={() => void handleSend()}
          disabled={isStreaming || !value.trim()}
          aria-label={labels.sendButton}
        >
          {labels.sendButton}
        </button>
      </div>
    </div>
  );
}
