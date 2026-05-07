import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { systemPrompt, messages } = await request.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ text: 'ANTHROPIC_API_KEY not configured. Set it in .env.local to enable AI chat.' }, { status: 200 });
  }

  const apiMessages = messages.map((m: { role: string; content: string }) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
  }));

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: apiMessages,
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ text: 'Failed to get response from AI. Please try again.' }, { status: 200 });
  }

  const data = await response.json();
  return NextResponse.json({ text: data.content?.[0]?.text ?? 'No response.' });
}
