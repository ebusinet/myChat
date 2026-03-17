import { useEffect, useContext, type ReactNode } from 'react';
import type { ContextLayer } from '@mychat/shared';
import { ContextCollectorContext, ParentLayerContext } from './ContextCollector.js';

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
 * Widgets are leaf nodes — they do not propagate ParentLayerContext to children.
 */
export function WidgetContext({ id, name, description, data, children }: WidgetContextProps) {
  const collector = useContext(ContextCollectorContext);
  const parentId = useContext(ParentLayerContext);

  useEffect(() => {
    if (!collector) return;

    const layer: ContextLayer = {
      type: 'widget',
      id,
      name,
      description,
      data,
    };

    collector.registerLayer(layer, parentId ?? undefined);

    return () => {
      collector.unregisterLayer(id);
    };
  }, [collector, parentId, id, name, description, data]);

  return <>{children}</>;
}
