import OpenAI from 'openai';
import { sanitizeEnv } from './env';

export function getOpenAIClient() {
  const apiKey = sanitizeEnv(process.env.OPENAI_API_KEY);
  if (!apiKey) {
    throw new Error('Falta OPENAI_API_KEY en el entorno.');
  }

  const isOpenRouter = apiKey.startsWith('sk-or-');
  
  return new OpenAI({
    apiKey,
    baseURL: isOpenRouter ? 'https://openrouter.ai/api/v1' : undefined,
    defaultHeaders: isOpenRouter ? {
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      'X-Title': 'AgentGrid Platform',
    } : undefined
  });
}

export async function generateAIResponse(options: {
  systemPrompt: string;
  input: string;
  model?: string;
  temperature?: number;
}) {
  const client = getOpenAIClient();
  const response = await client.responses.create({
    model: options.model || process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    instructions: options.systemPrompt,
    input: options.input,
    temperature: typeof options.temperature === 'number' ? options.temperature : 0.3,
    max_output_tokens: 1200,
  });

  return {
    id: response.id,
    text: response.output_text || '',
    model: response.model,
    inputTokens: response.usage?.input_tokens || 0,
    outputTokens: response.usage?.output_tokens || 0,
  };
}
