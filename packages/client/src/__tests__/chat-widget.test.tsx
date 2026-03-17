import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatWidget } from '../components/ChatWidget.js';
import { ChatContext, type ChatContextValue } from '../providers/ChatProvider.js';
import { defaultLabels } from '@mychat/shared';
import type { MyChatClientConfig } from '@mychat/shared';

const config: MyChatClientConfig = { serverUrl: '/api/chat' };

const mockChatValue: ChatContextValue = {
  sessions: [],
  activeSession: null,
  messages: [],
  isStreaming: false,
  createSession: vi.fn(),
  switchSession: vi.fn(),
  deleteSession: vi.fn(),
  sendMessage: vi.fn(),
  editMessage: vi.fn(),
  getBranchOptions: vi.fn(),
  switchBranch: vi.fn(),
  contextLayers: [],
  labels: defaultLabels,
  config,
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ChatContext.Provider value={mockChatValue}>
      {children}
    </ChatContext.Provider>
  );
}

describe('ChatWidget', () => {
  it('renders the chat panel inline', () => {
    const { container } = render(
      <Wrapper>
        <ChatWidget />
      </Wrapper>,
    );

    const widget = container.querySelector('.mychat-widget-container');
    expect(widget).not.toBeNull();
    // Contains the chat panel
    expect(widget!.querySelector('.mychat-panel')).not.toBeNull();
  });

  it('applies default width and height', () => {
    const { container } = render(
      <Wrapper>
        <ChatWidget />
      </Wrapper>,
    );

    const widget = container.querySelector('.mychat-widget-container') as HTMLElement;
    expect(widget.style.width).toBe('100%');
    expect(widget.style.height).toBe('500px');
  });

  it('accepts custom dimensions', () => {
    const { container } = render(
      <Wrapper>
        <ChatWidget width="600px" height="400px" />
      </Wrapper>,
    );

    const widget = container.querySelector('.mychat-widget-container') as HTMLElement;
    expect(widget.style.width).toBe('600px');
    expect(widget.style.height).toBe('400px');
  });

  it('accepts additional className', () => {
    const { container } = render(
      <Wrapper>
        <ChatWidget className="my-custom-class" />
      </Wrapper>,
    );

    const widget = container.querySelector('.mychat-widget-container');
    expect(widget!.classList.contains('my-custom-class')).toBe(true);
  });

  it('does not render a bubble button', () => {
    const { container } = render(
      <Wrapper>
        <ChatWidget />
      </Wrapper>,
    );

    expect(container.querySelector('.mychat-bubble-btn')).toBeNull();
    expect(container.querySelector('.mychat-bubble-container')).toBeNull();
  });
});
