import { BaseLlmProvider, LlmRequest, LlmResponse, LlmStreamChunk } from './llm-provider';
import { env } from '@/lib/env';
import { logger } from '@/server/shared/logger';

const log = logger.child({ module: 'GeminiAdapter' });

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
      role: string;
    };
    finishReason: string;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GeminiAdapter extends BaseLlmProvider {
  name = 'GEMINI';
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor() {
    super({
      apiKey: env.GEMINI_API_KEY,
      defaultModel: 'gemini-1.5-pro',
      costPer1kInputInr: 0.105,
      costPer1kOutputInr: 0.42,
    });
  }

  async generate(request: LlmRequest): Promise<LlmResponse> {
    if (!this.isAvailable()) throw new Error('Gemini API key not configured');

    const startTime = Date.now();
    const model = request.model || this.defaultModel;

    try {
      const systemInstruction = request.messages.find(m => m.role === 'system')?.content;
      const conversationMessages = request.messages.filter(m => m.role !== 'system');

      const body: any = {
        contents: conversationMessages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? 2000,
        },
      };

      if (systemInstruction) {
        body.systemInstruction = { parts: [{ text: systemInstruction }] };
      }

      if (request.jsonMode) {
        body.generationConfig.responseMimeType = 'application/json';
      }

      const response = await fetch(
        `${this.baseUrl}/${model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorBody}`);
      }

      const data: GeminiResponse = await response.json();
      const latencyMs = Date.now() - startTime;
      const tokensIn = data.usageMetadata.promptTokenCount;
      const tokensOut = data.usageMetadata.candidatesTokenCount;
      const costInr = this.calculateCost(tokensIn, tokensOut);

      return {
        content: data.candidates[0].content.parts.map(p => p.text).join(''),
        tokensIn,
        tokensOut,
        latencyMs,
        provider: this.name,
        model,
        costInr,
      };
    } catch (error) {
      log.error({ error }, 'Gemini generate failed');
      throw error;
    }
  }

  async *generateStream(request: LlmRequest): AsyncIterable<LlmStreamChunk> {
    if (!this.isAvailable()) throw new Error('Gemini API key not configured');

    const model = request.model || this.defaultModel;
    const systemInstruction = request.messages.find(m => m.role === 'system')?.content;
    const conversationMessages = request.messages.filter(m => m.role !== 'system');

    const body: any = {
      contents: conversationMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 2000,
      },
    };

    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const response = await fetch(
      `${this.baseUrl}/${model}:streamGenerateContent?key=${this.apiKey}&alt=sse`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok || !response.body) {
      throw new Error(`Gemini stream error: ${response.status}`);
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
            const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) {
              yield { content, done: false };
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
      yield { content: '', done: true };
    } finally {
      reader.releaseLock();
    }
  }
}