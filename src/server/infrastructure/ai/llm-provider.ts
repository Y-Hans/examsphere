export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmRequest {
  messages: LlmMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  jsonMode?: boolean;
}

export interface LlmResponse {
  content: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  provider: string;
  model: string;
  costInr: number;
}

export interface LlmStreamChunk {
  content: string;
  done: boolean;
}

export interface LlmProvider {
  name: string;
  generate(request: LlmRequest): Promise<LlmResponse>;
  generateStream(request: LlmRequest): AsyncIterable<LlmStreamChunk>;
  isAvailable(): boolean;
}

export abstract class BaseLlmProvider implements LlmProvider {
  abstract name: string;
  protected defaultModel: string;
  protected apiKey: string | undefined;
  protected costPer1kInputInr: number;
  protected costPer1kOutputInr: number;

  constructor(config: {
    apiKey?: string;
    defaultModel: string;
    costPer1kInputInr: number;
    costPer1kOutputInr: number;
  }) {
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel;
    this.costPer1kInputInr = config.costPer1kInputInr;
    this.costPer1kOutputInr = config.costPer1kOutputInr;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  protected calculateCost(tokensIn: number, tokensOut: number): number {
    return (
      (tokensIn / 1000) * this.costPer1kInputInr +
      (tokensOut / 1000) * this.costPer1kOutputInr
    );
  }

  abstract generate(request: LlmRequest): Promise<LlmResponse>;
  abstract generateStream(request: LlmRequest): AsyncIterable<LlmStreamChunk>;
}