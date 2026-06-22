import { BaseLlmProvider, LlmRequest, LlmResponse, LlmStreamChunk } from './llm-provider';
import { env } from '@/lib/env';
import { logger } from '@/server/shared/logger';

const log = logger.child({ module: 'GLMAdapter' });

interface GLMResponse {
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

export class GLMAdapter extends BaseLlmProvider {
  name = 'GLM';
  private baseUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

  constructor() {
    super({
      apiKey: env.GLM_API_KEY,
      defaultModel: 'glm-4-plus',
      costPer1kInputInr: 0.045,
      costPer1kOutputInr: 0.045,
    });
  }

  async generate(request: LlmRequest): Promise<LlmResponse> {
    if (!this.isAvailable()) throw new Error('GLM API key not configured');

    const startTime = Date.now();
    const model = request.model || this.defaultModel;

    try {
      const response = await fetch(this.baseUrl, {
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
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`GLM API error ${response.status}: ${errorBody}`);
      }

      const data: GLMResponse = await response.json();
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
      log.error({ error }, 'GLM generate failed');
      throw error;
    }
  }

  async *generateStream(request: LlmRequest): AsyncIterable<LlmStreamChunk> {
    if (!this.isAvailable()) throw new Error('GLM API key not configured');

    const model = request.model || this.defaultModel;

    const response = await fetch(this.baseUrl, {
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
      throw new Error(`GLM stream error: ${response.status}`);
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
            // Skip invalid JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}