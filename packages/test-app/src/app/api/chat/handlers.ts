import { createChatHandlers, type ChatHandlers } from '@mychat/server';
import { getConfig } from '@/lib/config-store';

// Use globalThis to survive Next.js dev hot-reloads (module-level vars reset)
const HANDLERS_KEY = '__mychat_chat_handlers__';
const CONFIG_KEY_KEY = '__mychat_chat_handlers_config_key__';

function getCached(): { handlers: ChatHandlers | null; configKey: string } {
  return {
    handlers: (globalThis as any)[HANDLERS_KEY] ?? null,
    configKey: (globalThis as any)[CONFIG_KEY_KEY] ?? '',
  };
}

function setCached(handlers: ChatHandlers, configKey: string): void {
  (globalThis as any)[HANDLERS_KEY] = handlers;
  (globalThis as any)[CONFIG_KEY_KEY] = configKey;
}

export function getHandlers(): ChatHandlers {
  const config = getConfig();
  const configKey = JSON.stringify(config.provider) + config.systemPrompt;
  const cached = getCached();

  if (cached.handlers && cached.configKey === configKey) {
    return cached.handlers;
  }

  const handlers = createChatHandlers({
    provider: config.provider,
    systemPrompt: config.systemPrompt,
  });
  setCached(handlers, configKey);
  return handlers;
}
