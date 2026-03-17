import type { ContextLayer, ContextSnapshot } from '@mychat/shared';

/**
 * Converts a ContextSnapshot into a structured system prompt string.
 * Recursively walks the context tree, formatting each layer so the AI
 * understands the application hierarchy and available data.
 */
export function buildContextPrompt(snapshot: ContextSnapshot): string {
  if (!snapshot.layers.length) return '';

  const sections: string[] = ['## Application Context', ''];

  for (const layer of snapshot.layers) {
    renderLayer(layer, 3, sections);
  }

  return sections.join('\n').trimEnd();
}

function renderLayer(
  layer: ContextLayer,
  headingLevel: number,
  out: string[],
): void {
  const prefix = '#'.repeat(headingLevel);
  const typeLabel = capitalize(layer.type);

  out.push(`${prefix} ${typeLabel}: ${layer.name}`);

  if (layer.description) {
    out.push(`Description: ${layer.description}`);
  }

  if (Object.keys(layer.data).length > 0) {
    out.push(`Data: ${JSON.stringify(layer.data)}`);
  }

  out.push('');

  if (layer.children?.length) {
    const nextLevel = Math.min(headingLevel + 1, 6);
    for (const child of layer.children) {
      renderLayer(child, nextLevel, out);
    }
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
