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

let currentConfig: RuntimeConfig = structuredClone(defaultConfig);

export function getConfig(): RuntimeConfig {
  return currentConfig;
}

export function updateConfig(partial: Partial<RuntimeConfig>): RuntimeConfig {
  currentConfig = { ...currentConfig, ...partial };
  return currentConfig;
}

export function resetConfig(): RuntimeConfig {
  currentConfig = structuredClone(defaultConfig);
  return currentConfig;
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 12) return '***';
  return key.slice(0, 8) + '...' + key.slice(-4);
}

export function getPublicConfig(): RuntimeConfig & { _masked: true } {
  const cfg = structuredClone(currentConfig);
  if ('apiKey' in cfg.provider && cfg.provider.apiKey) {
    (cfg.provider as any).apiKey = maskApiKey(cfg.provider.apiKey);
  }
  return { ...cfg, _masked: true };
}
