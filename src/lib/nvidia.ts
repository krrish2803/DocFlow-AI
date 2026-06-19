const NVIDIA_API_BASE = 'https://integrate.api.nvidia.com/v1';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function chatComplete(
  messages: Message[],
  apiKey: string,
  options: ChatOptions = {}
) {
  const model = options.model || 'meta/llama-3.1-8b-instruct';

  const res = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 4096,
      stream: false,
    }),
  });

  if (!res.ok) {
    const error = await res.text().catch(() => res.statusText);
    throw new Error(`NVIDIA API error (${res.status}): ${error}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function generateWithNvidia(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  model?: string
): Promise<string> {
  return chatComplete(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    apiKey,
    { model }
  );
}
