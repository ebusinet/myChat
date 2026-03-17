import { useEffect, useContext, type ReactNode } from 'react';
import type { ContextLayer } from '@mychat/shared';
import { ContextCollectorContext, ParentLayerContext } from './ContextCollector.js';

export interface PagesContextProps {
  id: string;
  name: string;
  description?: string;
  data: Record<string, unknown>;
  children: ReactNode;
}

/**
 * Registers a 'pages' context layer — a container for multiple PageContext components.
 * Represents the set of pages currently loaded (tabs, split-view, multi-page layout).
 */
export function PagesContext({ id, name, description, data, children }: PagesContextProps) {
  const collector = useContext(ContextCollectorContext);
  const parentId = useContext(ParentLayerContext);

  useEffect(() => {
    if (!collector) return;

    const layer: ContextLayer = {
      type: 'pages',
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
