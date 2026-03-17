import Anthropic from '@anthropic-ai/sdk';
import type {
  AIProvider,
  AnthropicProviderConfig,
  ChatParams,
  ChatStreamEvent,
} from '@mychat/shared';
import { buildContextPrompt } from '../context/builder.js';

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_MAX_TOKENS = 4096;

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';
  private client: Anthropic;
  private model: string;
  private maxTokens: number;

  constructor(config: AnthropicProviderConfig) {
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.model = config.model ?? DEFAULT_MODEL;
    this.maxTokens = config.maxTokens ?? DEFAULT_MAX_TOKENS;
  }

  async *chat(params: ChatParams): AsyncIterable<ChatStreamEvent> {
    const contextPrompt = buildContextPrompt(params.context);
    const systemParts: string[] = [];
    if (params.systemPrompt) systemParts.push(params.systemPrompt);
    if (contextPrompt) systemParts.push(contextPrompt);
    const system = systemParts.join('\n\n') || undefined;

    const messages: Anthropic.MessageParam[] = params.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const stream = this.client.messages.stream({
      model: params.model ?? this.model,
      max_tokens: params.maxTokens ?? this.maxTokens,
      system,
      messages,
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield { type: 'text_delta', content: event.delta.text };
      }
    }
  }
}
