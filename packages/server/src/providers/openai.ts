import OpenAI from 'openai';
import type {
  AIProvider,
  OpenAIProviderConfig,
  ChatParams,
  ChatStreamEvent,
} from '@mychat/shared';
import { buildContextPrompt } from '../context/builder.js';

const DEFAULT_MODEL = 'gpt-4o';
const DEFAULT_MAX_TOKENS = 4096;

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  private client: OpenAI;
  private model: string;
  private maxTokens: number;

  constructor(config: OpenAIProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
    this.model = config.model ?? DEFAULT_MODEL;
    this.maxTokens = config.maxTokens ?? DEFAULT_MAX_TOKENS;
  }

  async *chat(params: ChatParams): AsyncIterable<ChatStreamEvent> {
    const contextPrompt = buildContextPrompt(params.context);
    const systemParts: string[] = [];
    if (params.systemPrompt) systemParts.push(params.systemPrompt);
    if (contextPrompt) systemParts.push(contextPrompt);

    const messages: OpenAI.ChatCompletionMessageParam[] = [];

    if (systemParts.length > 0) {
      messages.push({ role: 'system', content: systemParts.join('\n\n') });
    }

    for (const m of params.messages) {
      if (m.role === 'system') continue;
      messages.push({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      });
    }

    const stream = await this.client.chat.completions.create({
      model: params.model ?? this.model,
      max_tokens: params.maxTokens ?? this.maxTokens,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield { type: 'text_delta', content: delta };
      }
    }
  }
}
