/**
 * Hierarchical context collected from the host application.
 *
 * The tree follows: App → User → Session → Page(s) → Widget(s)
 * Each layer carries arbitrary data the AI can reason about.
 */

export type ContextLayerType = 'app' | 'user' | 'session' | 'pages' | 'page' | 'widget';

export interface ContextLayer {
  type: ContextLayerType;
  id: string;
  name: string;
  description?: string;
  data: Record<string, unknown>;
  children?: ContextLayer[];
}

/**
 * Flattened snapshot of the full context tree,
 * sent to the server alongside each user message.
 */
export interface ContextSnapshot {
  collectedAt: string; // ISO timestamp
  layers: ContextLayer[];
}

/**
 * Defines which context layers a ChatInstance should include in its snapshots.
 * - 'all': include everything (default)
 * - { include: string[] }: only these layer IDs (+ their ancestors for tree coherence)
 * - { exclude: string[] }: everything except these layer IDs
 * - function: custom predicate applied to each layer
 */
export type ContextScope =
  | 'all'
  | { include: string[] }
  | { exclude: string[] }
  | ((layer: ContextLayer) => boolean);
