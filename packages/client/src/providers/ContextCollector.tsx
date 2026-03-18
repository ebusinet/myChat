import { createContext, useCallback, useMemo, useRef, type ReactNode } from 'react';
import type { ContextLayer, ContextSnapshot, ContextScope } from '@mychat/shared';

export interface ContextCollectorValue {
  registerLayer(layer: ContextLayer, parentId?: string): void;
  unregisterLayer(id: string): void;
  getSnapshot(): ContextSnapshot;
  getFilteredSnapshot(scope: ContextScope): ContextSnapshot;
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

  const getFilteredSnapshot = useCallback((scope: ContextScope): ContextSnapshot => {
    const snapshot = getSnapshot();
    if (scope === 'all') return snapshot;

    // Flatten the tree and build a parent map
    const flatLayers: ContextLayer[] = [];
    const treeParentMap = new Map<string, string>();

    function flatten(layers: ContextLayer[], parentId?: string) {
      for (const layer of layers) {
        flatLayers.push(layer);
        if (parentId) treeParentMap.set(layer.id, parentId);
        if (layer.children) flatten(layer.children, layer.id);
      }
    }
    flatten(snapshot.layers);

    // Determine which IDs to keep
    let keepIds: Set<string>;

    if (typeof scope === 'function') {
      keepIds = new Set(flatLayers.filter(scope).map(l => l.id));
    } else if ('include' in scope) {
      keepIds = new Set(scope.include.filter(id => flatLayers.some(l => l.id === id)));
    } else {
      const excludeSet = new Set(scope.exclude);
      keepIds = new Set(flatLayers.filter(l => !excludeSet.has(l.id)).map(l => l.id));
    }

    // Add ancestors for include/function scopes (tree coherence)
    if (typeof scope === 'function' || (typeof scope === 'object' && 'include' in scope)) {
      const ancestorIds = new Set<string>();
      for (const id of keepIds) {
        let current = id;
        while (treeParentMap.has(current)) {
          const parent = treeParentMap.get(current)!;
          ancestorIds.add(parent);
          current = parent;
        }
      }
      for (const id of ancestorIds) keepIds.add(id);
    }

    // Rebuild filtered tree
    function filterTree(layers: ContextLayer[]): ContextLayer[] {
      return layers
        .filter(l => keepIds.has(l.id))
        .map(l => ({
          ...l,
          children: l.children ? filterTree(l.children) : [],
        }));
    }

    return {
      collectedAt: snapshot.collectedAt,
      layers: filterTree(snapshot.layers),
    };
  }, [getSnapshot]);

  const value = useMemo<ContextCollectorValue>(() => ({
    registerLayer,
    unregisterLayer,
    getSnapshot,
    getFilteredSnapshot,
  }), [registerLayer, unregisterLayer, getSnapshot, getFilteredSnapshot]);

  return (
    <ContextCollectorContext.Provider value={value}>
      {children}
    </ContextCollectorContext.Provider>
  );
}

/**
 * Public alias for ContextCollector.
 * Use when you need a standalone context registry without a built-in chat.
 * Pair with one or more <ChatInstance> components.
 */
export const ContextProvider = ContextCollector;
