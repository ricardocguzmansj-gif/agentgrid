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
  history?: { role: 'user' | 'assistant'; content: string }[];
  model?: string;
  temperature?: number;
}) {
  const client = getOpenAIClient();
  const messages: any[] = [
    { role: 'system', content: options.systemPrompt },
  ];
  
  if (options.history && options.history.length > 0) {
    messages.push(...options.history);
  }
  
  messages.push({ role: 'user', content: options.input });

  const response = await client.chat.completions.create({
    model: options.model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages,
    temperature: typeof options.temperature === 'number' ? options.temperature : 0.3,
    max_tokens: 1200,
  });

  return {
    id: response.id,
    text: response.choices[0]?.message?.content || '',
    model: response.model,
    inputTokens: response.usage?.prompt_tokens || 0,
    outputTokens: response.usage?.completion_tokens || 0,
  };
}
