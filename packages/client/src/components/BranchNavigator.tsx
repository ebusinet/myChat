import { useMemo } from 'react';
import type { ChatMessage } from '@mychat/shared';

export interface BranchNavigatorProps {
  siblings: ChatMessage[];
  activeId: string;
  onSwitch: (messageId: string) => void;
}

export function BranchNavigator({ siblings, activeId, onSwitch }: BranchNavigatorProps) {
  const sorted = useMemo(
    () => [...siblings].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [siblings],
  );

  const currentIndex = sorted.findIndex(m => m.id === activeId);
  if (sorted.length <= 1) return null;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < sorted.length - 1;

  return (
    <div className="mychat-branch-nav">
      <button
        className="mychat-branch-nav-btn"
        disabled={!hasPrev}
        onClick={() => hasPrev && onSwitch(sorted[currentIndex - 1]!.id)}
        aria-label="Previous branch"
      >
        &#9664;
      </button>
      <span className="mychat-branch-nav-label">
        {currentIndex + 1}/{sorted.length}
      </span>
      <button
        className="mychat-branch-nav-btn"
        disabled={!hasNext}
        onClick={() => hasNext && onSwitch(sorted[currentIndex + 1]!.id)}
        aria-label="Next branch"
      >
        &#9654;
      </button>
    </div>
  );
}
