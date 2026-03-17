import { useContext } from 'react';
import { ContextCollectorContext } from '../providers/ContextCollector.js';

export function useContextCollector() {
  const ctx = useContext(ContextCollectorContext);
  if (!ctx) throw new Error('useContextCollector must be used within ChatProvider');
  return ctx;
}
