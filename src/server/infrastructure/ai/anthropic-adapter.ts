import { BaseLlmProvider, LlmRequest, LlmResponse, LlmStreamChunk } from './llm-provider';
import { env } from '@/lib/env';
import { logger } from '@/server/shared/logger';

const log = logger.child({ module: 'AnthropicAdapter' });

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>;
  model: string;
  role: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class AnthropicAdapter extends BaseLlmProvider {
  name = 'ANTHROPIC';
  private baseUrl = 'https://api.anthropic.com/v1/messages';

  constructor() {
    super({
      apiKey: env.ANTHROPIC_API_KEY,
      defaultModel: 'claude-3-5-sonnet-20241022',
      costPer1kInputInr: 0.245,
      costPer1kOutputInr: 1.225,
    });
  }

  async generate(request: LlmRequest): Promise<LlmResponse> {
    if (!this.isAvailable()) throw new Error('Anthropic API key not configured');

    const startTime = Date.now();
    const model = request.model || this.defaultModel;

    try {
      const systemMessage = request.messages.find(m => m.role === 'system')?.content || '';
      const conversationMessages = request.messages.filter(m => m.role !== 'system');

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          system: systemMessage,
          messages: conversationMessages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
          max_tokens: request.maxTokens ?? 2000,
          temperature: request.temperature ?? 0.7,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Anthropic API error ${response.status}: ${errorBody}`);
      }

      const data: AnthropicResponse = await response.json();
      const latencyMs = Date.now() - startTime;
      const tokensIn = data.usage.input_tokens;
      const tokensOut = data.usage.output_tokens;
      const costInr = this.calculateCost(tokensIn, tokensOut);

      return {
        content: data.content.map(c => c.text).join(''),
        tokensIn,
        tokensOut,
        latencyMs,
        provider: this.name,
        model,
        costInr,
      };
    } catch (error) {
      log.error({ error }, 'Anthropic generate failed');
      throw error;
    }
  }

  async *generateStream(request: LlmRequest): AsyncIterable<LlmStreamChunk> {
    if (!this.isAvailable()) throw new Error('Anthropic API key not configured');

    const model = request.model || this.defaultModel;
    const systemMessage = request.messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = request.messages.filter(m => m.role !== 'system');

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        system: systemMessage,
        messages: conversationMessages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        max_tokens: request.maxTokens ?? 2000,
        temperature: request.temperature ?? 0.7,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Anthropic stream error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              yield { content: parsed.delta.text, done: false };
            }
            if (parsed.type === 'message_stop') {
              yield { content: '', done: true };
              return;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}