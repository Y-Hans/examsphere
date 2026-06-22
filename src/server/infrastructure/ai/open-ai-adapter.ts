import { BaseLlmProvider, LlmRequest, LlmResponse, LlmStreamChunk } from './llm-provider';
import { env } from '@/lib/env';
import { logger } from '@/server/shared/logger';

const log = logger.child({ module: 'OpenAIAdapter' });

interface OpenAIChatResponse {
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIAdapter extends BaseLlmProvider {
  name = 'OPENAI';

  constructor() {
    super({
      apiKey: env.OPENAI_API_KEY,
      defaultModel: 'gpt-4o',
      costPer1kInputInr: 0.175,
      costPer1kOutputInr: 0.70,
    });
  }

  async generate(request: LlmRequest): Promise<LlmResponse> {
    if (!this.isAvailable()) throw new Error('OpenAI API key not configured');

    const startTime = Date.now();
    const model = request.model || this.defaultModel;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 2000,
          response_format: request.jsonMode ? { type: 'json_object' } : undefined,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
      }

      const data: OpenAIChatResponse = await response.json();
      const latencyMs = Date.now() - startTime;
      const tokensIn = data.usage.prompt_tokens;
      const tokensOut = data.usage.completion_tokens;
      const costInr = this.calculateCost(tokensIn, tokensOut);

      return {
        content: data.choices[0].message.content,
        tokensIn,
        tokensOut,
        latencyMs,
        provider: this.name,
        model,
        costInr,
      };
    } catch (error) {
      log.error({ error }, 'OpenAI generate failed');
      throw error;
    }
  }

  async *generateStream(request: LlmRequest): AsyncIterable<LlmStreamChunk> {
    if (!this.isAvailable()) throw new Error('OpenAI API key not configured');

    const model = request.model || this.defaultModel;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2000,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`OpenAI stream error: ${response.status}`);
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
          if (data === '[DONE]') {
            yield { content: '', done: true };
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield { content, done: false };
            }
          } catch {
            // Skip invalid JSON chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}