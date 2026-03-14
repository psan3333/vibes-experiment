export interface AIProvider {
  id: string;
  name: string;
  description: string;
  apiKeyRequired: boolean;
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
  baseUrl: string;
  model?: string;
  supportsCustomModel: boolean;
}

export interface AIProviderConfig {
  providerId: string;
  apiKey?: string;
  model?: string;
}

export type TimePeriod = 'week' | 'month' | 'quarter' | 'year' | 'all';

export const TIME_PERIODS: { value: TimePeriod; label: string; days: number }[] = [
  { value: 'week', label: 'Last 7 days', days: 7 },
  { value: 'month', label: 'Last 30 days', days: 30 },
  { value: 'quarter', label: 'Last 90 days', days: 90 },
  { value: 'year', label: 'Last 365 days', days: 365 },
  { value: 'all', label: 'All time', days: 0 },
];

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o and GPT-4o-mini models',
    apiKeyRequired: true,
    apiKeyLabel: 'OpenAI API Key',
    apiKeyPlaceholder: 'sk-...',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    supportsCustomModel: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 3.5 Sonnet and Opus models',
    apiKeyRequired: true,
    apiKeyLabel: 'Anthropic API Key',
    apiKeyPlaceholder: 'sk-ant-...',
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-sonnet-4-20250514',
    supportsCustomModel: true,
  },
  {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini 1.5 Pro and Flash models',
    apiKeyRequired: true,
    apiKeyLabel: 'Google AI API Key',
    apiKeyPlaceholder: 'AIza...',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-1.5-pro',
    supportsCustomModel: true,
  },
  {
    id: 'xai',
    name: 'xAI',
    description: 'Grok-2 model',
    apiKeyRequired: true,
    apiKeyLabel: 'xAI API Key',
    apiKeyPlaceholder: 'xai-...',
    baseUrl: 'https://api.x.ai/v1',
    model: 'grok-2-1212',
    supportsCustomModel: false,
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    description: 'Mistral Large and Codestral models',
    apiKeyRequired: true,
    apiKeyLabel: 'Mistral API Key',
    apiKeyPlaceholder: '...',
    baseUrl: 'https://api.mistral.ai/v1',
    model: 'mistral-large-latest',
    supportsCustomModel: true,
  },
  {
    id: 'cohere',
    name: 'Cohere',
    description: 'Command R+ and Command models',
    apiKeyRequired: true,
    apiKeyLabel: 'Cohere API Key',
    apiKeyPlaceholder: '...',
    baseUrl: 'https://api.cohere.ai/v1',
    model: 'command-r-plus',
    supportsCustomModel: true,
  },
  {
    id: 'ai21',
    name: 'AI21 Labs',
    description: 'Jurassic-2 Mid and Premium models',
    apiKeyRequired: true,
    apiKeyLabel: 'AI21 API Key',
    apiKeyPlaceholder: '...',
    baseUrl: 'https://api.ai21.com/v1',
    model: 'j2-mid',
    supportsCustomModel: true,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek Chat and Coder models',
    apiKeyRequired: true,
    apiKeyLabel: 'DeepSeek API Key',
    apiKeyPlaceholder: 'sk-...',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    supportsCustomModel: true,
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    description: 'Llama 3.1 Sonar and GPT models',
    apiKeyRequired: true,
    apiKeyLabel: 'Perplexity API Key',
    apiKeyPlaceholder: 'pplx-...',
    baseUrl: 'https://api.perplexity.ai',
    model: 'llama-3.1-sonar-large-128k-online',
    supportsCustomModel: false,
  },
  {
    id: 'together',
    name: 'Together AI',
    description: 'Llama, Mistral, and other open models',
    apiKeyRequired: true,
    apiKeyLabel: 'Together AI API Key',
    apiKeyPlaceholder: '...',
    baseUrl: 'https://api.together.ai/v1',
    model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    supportsCustomModel: true,
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    description: 'Run models locally on your machine',
    apiKeyRequired: false,
    apiKeyLabel: 'Ollama Base URL',
    apiKeyPlaceholder: 'http://localhost:11434',
    baseUrl: 'http://localhost:11434/api',
    model: 'llama3.2',
    supportsCustomModel: false,
  },
  {
    id: 'lmstudio',
    name: 'LM Studio (Local)',
    description: 'Use local LLMs via LM Studio',
    apiKeyRequired: false,
    apiKeyLabel: 'LM Studio Base URL',
    apiKeyPlaceholder: 'http://localhost:1234/v1',
    baseUrl: 'http://localhost:1234/v1',
    model: 'llama-3-8b-instruct',
    supportsCustomModel: false,
  },
];

export const getProviderById = (id: string): AIProvider | undefined => {
  return AI_PROVIDERS.find(p => p.id === id);
};
