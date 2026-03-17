import { useEffect, useContext, type ReactNode } from 'react';
import type { ContextLayer } from '@mychat/shared';
import { ContextCollectorContext, ParentLayerContext } from './ContextCollector.js';

export interface UserContextProps {
  id: string;
  name: string;
  description?: string;
  data: Record<string, unknown>;
  children: ReactNode;
}

/**
 * Registers a 'user' context layer.
 * Provides user information (role, preferences, permissions) to the AI.
 */
export function UserContext({ id, name, description, data, children }: UserContextProps) {
  const collector = useContext(ContextCollectorContext);
  const parentId = useContext(ParentLayerContext);

  useEffect(() => {
    if (!collector) return;

    const layer: ContextLayer = {
      type: 'user',
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
