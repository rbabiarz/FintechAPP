'use client';
import { useState, useEffect, useRef } from 'react';
import { CHAT_SYSTEM_PROMPT, SUGGESTED_QUESTIONS } from '../lib/data';

interface Message { role: 'user' | 'assistant'; text: string; error?: boolean }

export default function AIChatSurface({ onClose, accent }: { onClose: () => void; accent: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: "Hi! I'm your financial guidance assistant. I can help you understand your alignment score, spending patterns, and goal progress. What would you like to know?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollTop = bottomRef.current.scrollHeight;
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg = text.trim();
    setInput('');
    setShowSuggestions(false);
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role, content: m.text }));
      history.push({ role: 'user', content: userMsg });
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ systemPrompt: CHAT_SYSTEM_PROMPT, messages: history }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.text || 'Sorry, something went wrong.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: "I'm having trouble connecting right now. Please try again in a moment.", error: true }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#FAF7F2', zIndex: 80, display: 'flex', flexDirection: 'column', animation: 'chatSlideUp 0.3s cubic-bezier(.2,.8,.4,1)' }}>
      <style>{`.chat-input:focus{border-color:${accent}!important;outline:none}.chat-input::placeholder{color:#94A3B8}`}</style>

      {/* Header */}
      <div style={{ padding: '16px 20px 12px', background: '#FAF7F2', flexShrink: 0, borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.1)' }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#0F2A4A' }}>Financial Guidance</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>Educational · Not personalized advice</div>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✨</div>
        </div>
      </div>

      {/* Messages */}
      <div ref={bottomRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', animation: 'chatMsgIn 0.22s ease' }}>
            {m.role === 'assistant' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', maxWidth: '88%' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, marginBottom: 2 }}>✨</div>
                <div style={{ background: '#fff', borderRadius: '18px 18px 18px 4px', padding: '12px 14px', boxShadow: '0 1px 8px rgba(0,0,0,0.07)', fontSize: 14, color: '#0F2A4A', lineHeight: 1.6, border: m.error ? '1px solid #FEE2E2' : 'none' }}>
                  {m.text}
                </div>
              </div>
            )}
            {m.role === 'user' && (
              <div style={{ background: accent, borderRadius: '18px 18px 4px 18px', padding: '11px 14px', fontSize: 14, color: '#fff', lineHeight: 1.5, maxWidth: '80%' }}>
                {m.text}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', animation: 'chatMsgIn 0.2s ease' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>✨</div>
            <div style={{ background: '#fff', borderRadius: '18px 18px 18px 4px', padding: '14px 16px', boxShadow: '0 1px 8px rgba(0,0,0,0.07)', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: accent, animation: `chatDot 1.2s ease ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {showSuggestions && messages.length <= 1 && (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 36 }}>Try asking</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 36 }}>
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)} style={{ padding: '9px 14px', borderRadius: 12, border: '1.5px solid #E2E8F0', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', lineHeight: 1.4, transition: 'all 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ height: 4 }} />
      </div>

      <div style={{ padding: '6px 16px 0', flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: '#94A3B8', textAlign: 'center', lineHeight: 1.4 }}>Educational guidance only · Not personalized investment advice</div>
      </div>

      {/* Input */}
      <div style={{ padding: '8px 16px 32px', flexShrink: 0, display: 'flex', gap: 10, alignItems: 'flex-end', background: '#FAF7F2' }}>
        <textarea ref={inputRef} className="chat-input" value={input}
          onChange={e => { setInput(e.target.value); e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 100) + 'px'; }}
          onKeyDown={handleKey} placeholder="Ask about your finances…" rows={1}
          style={{ flex: 1, padding: '11px 14px', borderRadius: 18, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 14, color: '#0F2A4A', fontFamily: 'inherit', resize: 'none', lineHeight: 1.5, maxHeight: 100, overflow: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }} />
        <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
          style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', background: input.trim() && !loading ? accent : '#E2E8F0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M16 9L2 2l3.5 7L2 16l14-7z" fill={input.trim() && !loading ? '#fff' : '#94A3B8'} /></svg>
        </button>
      </div>
    </div>
  );
}
