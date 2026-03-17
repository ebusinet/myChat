import { createContext, useCallback, useMemo, useRef, type ReactNode } from 'react';
import type { ContextLayer, ContextSnapshot } from '@mychat/shared';

export interface ContextCollectorValue {
  registerLayer(layer: ContextLayer): void;
  unregisterLayer(id: string): void;
  getSnapshot(): ContextSnapshot;
}

export const ContextCollectorContext = createContext<ContextCollectorValue | null>(null);

/**
 * Tracks the current parent page layer for nested WidgetContext components.
 */
export const PageLayerContext = createContext<string | null>(null);

/**
 * Registry for context layers. Uses a mutable ref — no re-renders on register/unregister.
 * The snapshot is read on-demand (when the user sends a message), not reactively.
 */
export function ContextCollector({ children }: { children: ReactNode }) {
  const layersRef = useRef<Map<string, ContextLayer>>(new Map());

  const registerLayer = useCallback((layer: ContextLayer) => {
    layersRef.current.set(layer.id, layer);
  }, []);

  const unregisterLayer = useCallback((id: string) => {
    layersRef.current.delete(id);
    for (const layer of layersRef.current.values()) {
      if (layer.children) {
        layer.children = layer.children.filter(c => c.id !== id);
      }
    }
  }, []);

  const getSnapshot = useCallback((): ContextSnapshot => {
    return {
      collectedAt: new Date().toISOString(),
      layers: Array.from(layersRef.current.values()),
    };
  }, []);

  const value = useMemo<ContextCollectorValue>(() => ({
    registerLayer,
    unregisterLayer,
    getSnapshot,
  }), [registerLayer, unregisterLayer, getSnapshot]);

  return (
    <ContextCollectorContext.Provider value={value}>
      {children}
    </ContextCollectorContext.Provider>
  );
}
