import { GoogleGenAI } from '@google/genai';
import type {
  AIProvider,
  GeminiProviderConfig,
  ChatParams,
  ChatStreamEvent,
} from '@mychat/shared';
import { buildContextPrompt } from '../context/builder.js';

const DEFAULT_MODEL = 'gemini-2.0-flash';
const DEFAULT_MAX_TOKENS = 4096;

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  private client: GoogleGenAI;
  private model: string;
  private maxTokens: number;

  constructor(config: GeminiProviderConfig) {
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
    this.model = config.model ?? DEFAULT_MODEL;
    this.maxTokens = config.maxTokens ?? DEFAULT_MAX_TOKENS;
  }

  async *chat(params: ChatParams): AsyncIterable<ChatStreamEvent> {
    const contextPrompt = buildContextPrompt(params.context);
    const systemParts: string[] = [];
    if (params.systemPrompt) systemParts.push(params.systemPrompt);
    if (contextPrompt) systemParts.push(contextPrompt);

    // Convert messages to Gemini format (role: 'user' | 'model')
    const contents = params.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' as const : 'user' as const,
        parts: [{ text: m.content }],
      }));

    const response = await this.client.models.generateContentStream({
      model: params.model ?? this.model,
      contents,
      config: {
        maxOutputTokens: params.maxTokens ?? this.maxTokens,
        systemInstruction: systemParts.length > 0
          ? systemParts.join('\n\n')
          : undefined,
      },
    });

    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        yield { type: 'text_delta', content: text };
      }
    }
  }
}
