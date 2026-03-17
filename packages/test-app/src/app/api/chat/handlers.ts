import { createChatHandlers, type ChatHandlers } from '@mychat/server';
import { getConfig } from '@/lib/config-store';

let cachedConfigKey = '';
let cachedHandlers: ChatHandlers | null = null;

export function getHandlers(): ChatHandlers {
  const config = getConfig();
  const configKey = JSON.stringify(config.provider) + config.systemPrompt;

  if (cachedHandlers && cachedConfigKey === configKey) {
    return cachedHandlers;
  }

  cachedHandlers = createChatHandlers({
    provider: config.provider,
    systemPrompt: config.systemPrompt,
  });
  cachedConfigKey = configKey;
  return cachedHandlers;
}
