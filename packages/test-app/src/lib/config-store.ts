import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
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

const CONFIG_FILE = join(process.cwd(), '.mychat-config.json');

// Use globalThis to survive Next.js dev hot-reloads
const globalKey = '__mychat_runtime_config__' as const;

function readFromDisk(): RuntimeConfig | null {
  try {
    const raw = readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw) as RuntimeConfig;
  } catch {
    return null;
  }
}

function writeToDisk(config: RuntimeConfig): void {
  try {
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch {
    // Silently fail if disk write is not possible
  }
}

function getCurrentConfig(): RuntimeConfig {
  // Layer 1: in-memory (hot-reload safe)
  const mem = (globalThis as any)[globalKey];
  if (mem) return mem;

  // Layer 2: persisted file
  const disk = readFromDisk();
  if (disk) {
    (globalThis as any)[globalKey] = disk;
    return disk;
  }

  // Layer 3: defaults
  return structuredClone(defaultConfig);
}

function setCurrentConfig(config: RuntimeConfig): void {
  (globalThis as any)[globalKey] = config;
  writeToDisk(config);
}

// Initialize on first load
if (!(globalThis as any)[globalKey]) {
  const persisted = readFromDisk();
  setCurrentConfig(persisted ?? structuredClone(defaultConfig));
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
