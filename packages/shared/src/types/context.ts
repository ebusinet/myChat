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
