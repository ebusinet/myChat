import { useEffect, useContext, type ReactNode } from 'react';
import type { ContextLayer } from '@mychat/shared';
import { ContextCollectorContext, ParentLayerContext } from './ContextCollector.js';

export interface AppContextProps {
  id: string;
  name: string;
  description?: string;
  data: Record<string, unknown>;
  children: ReactNode;
}

/**
 * Registers an 'app' context layer — the top-level application context.
 * Provides global app metadata (name, version, environment) to the AI.
 */
export function AppContext({ id, name, description, data, children }: AppContextProps) {
  const collector = useContext(ContextCollectorContext);
  const parentId = useContext(ParentLayerContext);

  useEffect(() => {
    if (!collector) return;

    const layer: ContextLayer = {
      type: 'app',
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
