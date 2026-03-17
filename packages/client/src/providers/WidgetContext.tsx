import { useEffect, useContext, type ReactNode } from 'react';
import type { ContextLayer } from '@mychat/shared';
import { ContextCollectorContext, PageLayerContext } from './ContextCollector.js';

export interface WidgetContextProps {
  id: string;
  name: string;
  description?: string;
  data: Record<string, unknown>;
  children: ReactNode;
}

/**
 * Registers a 'widget' context layer in the ContextCollector.
 * Must be nested inside a PageContext to establish parent relationship.
 */
export function WidgetContext({ id, name, description, data, children }: WidgetContextProps) {
  const collector = useContext(ContextCollectorContext);
  const pageId = useContext(PageLayerContext);

  useEffect(() => {
    if (!collector) return;

    const layer: ContextLayer = {
      type: 'widget',
      id,
      name,
      description,
      data,
    };

    collector.registerLayer(layer);

    // If nested inside a PageContext, attach as a child of the page layer
    if (pageId) {
      const snapshot = collector.getSnapshot();
      const parentPage = snapshot.layers.find(l => l.id === pageId);
      if (parentPage) {
        if (!parentPage.children) parentPage.children = [];
        const alreadyExists = parentPage.children.some(c => c.id === id);
        if (!alreadyExists) {
          parentPage.children.push(layer);
        }
      }
    }

    return () => {
      collector.unregisterLayer(id);
    };
  }, [collector, pageId, id, name, description, data]);

  return <>{children}</>;
}
