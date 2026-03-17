import { ChatPanel } from './ChatPanel.js';

export interface ChatWidgetProps {
  /** Widget width (CSS value). Defaults to '100%'. */
  width?: string;
  /** Widget height (CSS value). Defaults to '500px'. */
  height?: string;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Inline chat widget rendered in the normal document flow.
 * Unlike ChatBubble (floating button), ChatWidget is placed where you put it in the JSX tree.
 */
export function ChatWidget({ width = '100%', height = '500px', className }: ChatWidgetProps) {
  return (
    <div
      className={`mychat-widget-container${className ? ` ${className}` : ''}`}
      style={{ width, height }}
    >
      <ChatPanel />
    </div>
  );
}
