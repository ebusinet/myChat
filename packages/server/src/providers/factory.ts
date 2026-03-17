import type { AIProvider, ProviderConfig } from '@mychat/shared';
import { AnthropicProvider } from './anthropic.js';
import { OpenAIProvider } from './openai.js';
import { GeminiProvider } from './gemini.js';
import { ClaudeAgentProvider } from './claude-agent.js';

/**
 * Instantiates the appropriate AIProvider based on config.type.
 */
export function createProvider(config: ProviderConfig): AIProvider {
  switch (config.type) {
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'openai':
      return new OpenAIProvider(config);
    case 'openai-compatible':
      return new OpenAIProvider({
        type: 'openai',
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        model: config.model,
        maxTokens: config.maxTokens,
      });
    case 'gemini':
      return new GeminiProvider(config);
    case 'claude-agent':
      return new ClaudeAgentProvider(config);
    default:
      throw new Error(
        `Unknown provider type: ${(config as ProviderConfig).type}`,
      );
  }
}
