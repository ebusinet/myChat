import { useEffect, useContext, type ReactNode } from 'react';
import type { ContextLayer } from '@mychat/shared';
import { ContextCollectorContext, PageLayerContext } from './ContextCollector.js';

export interface PageContextProps {
  id: string;
  name: string;
  description?: string;
  data: Record<string, unknown>;
  children: ReactNode;
}

/**
 * Registers a 'page' context layer in the ContextCollector.
 * Child WidgetContext components will be nested under this page.
 */
export function PageContext({ id, name, description, data, children }: PageContextProps) {
  const collector = useContext(ContextCollectorContext);

  useEffect(() => {
    if (!collector) return;

    const layer: ContextLayer = {
      type: 'page',
      id,
      name,
      description,
      data,
      children: [],
    };

    collector.registerLayer(layer);

    return () => {
      collector.unregisterLayer(id);
    };
  }, [collector, id, name, description, data]);

  return (
    <PageLayerContext.Provider value={id}>
      {children}
    </PageLayerContext.Provider>
  );
}
