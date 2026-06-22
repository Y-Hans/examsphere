import { LlmProvider } from './llm-provider';
import { OpenAIAdapter } from './openai-adapter';
import { GeminiAdapter } from './gemini-adapter';
import { AnthropicAdapter } from './anthropic-adapter';
import { GLMAdapter } from './glm-adapter';
import { DeepSeekAdapter } from './deepseek-adapter';
import { env } from '@/lib/env';
import { logger } from '@/server/shared/logger';

const log = logger.child({ module: 'ProviderRegistry' });

type ProviderName = 'OPENAI' | 'GEMINI' | 'ANTHROPIC' | 'GLM' | 'DEEPSEEK';

class ProviderRegistry {
  private providers: Map<ProviderName, LlmProvider> = new Map();
  private preferredProvider: ProviderName;
  private initialized = false;

  constructor() {
    const envProvider = (env as any).AI_PREFERRED_PROVIDER as string | undefined;
    this.preferredProvider = (envProvider as ProviderName) || 'OPENAI';
  }

  private initialize() {
    if (this.initialized) return;

    const openai = new OpenAIAdapter();
    const gemini = new GeminiAdapter();
    const anthropic = new AnthropicAdapter();
    const glm = new GLMAdapter();
    const deepseek = new DeepSeekAdapter();

    const allProviders: Array<[ProviderName, LlmProvider]> = [
      ['OPENAI', openai],
      ['GEMINI', gemini],
      ['ANTHROPIC', anthropic],
      ['GLM', glm],
      ['DEEPSEEK', deepseek],
    ];

    for (const [name, provider] of allProviders) {
      if (provider.isAvailable()) {
        this.providers.set(name, provider);
        log.info({ provider: name }, 'AI provider registered');
      }
    }

    if (!this.providers.has(this.preferredProvider)) {
      const firstAvailable = this.providers.keys().next();
      if (!firstAvailable.done) {
        log.warn(
          { preferred: this.preferredProvider, fallback: firstAvailable.value },
          'Preferred AI provider not available, falling back'
        );
        this.preferredProvider = firstAvailable.value;
      } else {
        log.warn('No AI providers available. AI features will be disabled.');
      }
    }

    this.initialized = true;
  }

  getProvider(name?: string): LlmProvider {
    this.initialize();
    const providerName = (name as ProviderName) || this.preferredProvider;
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`AI provider '${providerName}' is not available. Check API keys.`);
    }
    return provider;
  }

  getAvailableProviders(): string[] {
    this.initialize();
    return Array.from(this.providers.keys());
  }

  hasAnyProvider(): boolean {
    this.initialize();
    return this.providers.size > 0;
  }
}

export const providerRegistry = new ProviderRegistry();