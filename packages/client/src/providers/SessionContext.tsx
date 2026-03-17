import { useEffect, useContext, type ReactNode } from 'react';
import type { ContextLayer } from '@mychat/shared';
import { ContextCollectorContext, ParentLayerContext } from './ContextCollector.js';

export interface SessionContextProps {
  id: string;
  name: string;
  description?: string;
  data: Record<string, unknown>;
  children: ReactNode;
}

/**
 * Registers a 'session' context layer.
 * Provides session-level state (active navigation, global filters, theme) to the AI.
 */
export function SessionContext({ id, name, description, data, children }: SessionContextProps) {
  const collector = useContext(ContextCollectorContext);
  const parentId = useContext(ParentLayerContext);

  useEffect(() => {
    if (!collector) return;

    const layer: ContextLayer = {
      type: 'session',
      id,
      name,
      description,
      data,
      children: [],
    };

    collector.registerLayer(layer, parentId ?? undefined);

    return () => {
      collector.unregisterLayer(id);
    };
  }, [collector, parentId, id, name, description, data]);

  return (
    <ParentLayerContext.Provider value={id}>
      {children}
    </ParentLayerContext.Provider>
  );
}
