import type { ProviderConfig } from '@mychat/shared';

export interface RuntimeConfig {
  provider: ProviderConfig;
  systemPrompt: string;
}

const defaultConfig: RuntimeConfig = {
  provider: {
    type: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
  },
  systemPrompt: [
    'You are a helpful assistant embedded in a business dashboard.',
    'You have access to the full context of what the user is currently viewing.',
    'Answer questions about the displayed data, provide insights, and help with analysis.',
    'Be concise and data-driven. Reference specific numbers from the context when relevant.',
    'Respond in the same language as the user.',
  ].join('\n'),
};

// Use globalThis to survive Next.js dev hot-reloads
const globalKey = '__mychat_runtime_config__' as const;

function getCurrentConfig(): RuntimeConfig {
  return (globalThis as any)[globalKey] ?? structuredClone(defaultConfig);
}

function setCurrentConfig(config: RuntimeConfig): void {
  (globalThis as any)[globalKey] = config;
}

// Initialize on first load only
if (!(globalThis as any)[globalKey]) {
  setCurrentConfig(structuredClone(defaultConfig));
}

export function getConfig(): RuntimeConfig {
  return getCurrentConfig();
}

export function updateConfig(partial: Partial<RuntimeConfig>): RuntimeConfig {
  const updated = { ...getCurrentConfig(), ...partial };
  setCurrentConfig(updated);
  return updated;
}

export function resetConfig(): RuntimeConfig {
  const config = structuredClone(defaultConfig);
  setCurrentConfig(config);
  return config;
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 12) return '***';
  return key.slice(0, 8) + '...' + key.slice(-4);
}

export function getPublicConfig(): RuntimeConfig & { _masked: true } {
  const cfg = structuredClone(getCurrentConfig());
  if ('apiKey' in cfg.provider && cfg.provider.apiKey) {
    (cfg.provider as any).apiKey = maskApiKey(cfg.provider.apiKey);
  }
  return { ...cfg, _masked: true };
}
