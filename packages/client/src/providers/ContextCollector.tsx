import { createContext, useCallback, useMemo, useRef, type ReactNode } from 'react';
import type { ContextLayer, ContextSnapshot } from '@mychat/shared';

export interface ContextCollectorValue {
  registerLayer(layer: ContextLayer, parentId?: string): void;
  unregisterLayer(id: string): void;
  getSnapshot(): ContextSnapshot;
}

export const ContextCollectorContext = createContext<ContextCollectorValue | null>(null);

/**
 * Tracks the current parent layer for nested context components.
 * Each context provider reads this to find its parent, then sets it to its own ID.
 */
export const ParentLayerContext = createContext<string | null>(null);

/**
 * Registry for context layers. Uses a mutable ref — no re-renders on register/unregister.
 * The snapshot is read on-demand (when the user sends a message), not reactively.
 *
 * Parent-child relationships are stored separately and resolved at snapshot time,
 * because React useEffect fires child-first — children register before their parents.
 */
export function ContextCollector({ children }: { children: ReactNode }) {
  const layersRef = useRef<Map<string, ContextLayer>>(new Map());
  const parentMapRef = useRef<Map<string, string>>(new Map());

  const registerLayer = useCallback((layer: ContextLayer, parentId?: string) => {
    layersRef.current.set(layer.id, layer);
    if (parentId) {
      parentMapRef.current.set(layer.id, parentId);
    }
  }, []);

  const unregisterLayer = useCallback((id: string) => {
    layersRef.current.delete(id);
    parentMapRef.current.delete(id);
    // Clean up orphaned children that referenced this layer as parent
    for (const [childId, pId] of parentMapRef.current.entries()) {
      if (pId === id) {
        parentMapRef.current.delete(childId);
      }
    }
  }, []);

  const getSnapshot = useCallback((): ContextSnapshot => {
    // Reset all children arrays before rebuilding the tree
    for (const layer of layersRef.current.values()) {
      layer.children = [];
    }

    // Build parent-child relationships from the parentMap
    for (const [childId, parentId] of parentMapRef.current.entries()) {
      const child = layersRef.current.get(childId);
      const parent = layersRef.current.get(parentId);
      if (child && parent) {
        parent.children!.push(child);
      }
    }

    // Return only root layers (those without a parent)
    const rootLayers = Array.from(layersRef.current.values())
      .filter(l => !parentMapRef.current.has(l.id));

    return {
      collectedAt: new Date().toISOString(),
      layers: rootLayers,
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
