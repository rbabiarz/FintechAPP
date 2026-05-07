'use client';
import { useState, useEffect, useRef } from 'react';
import { CHAT_SYSTEM_PROMPT, SUGGESTED_QUESTIONS } from '../lib/data';

interface Message { role: 'user' | 'assistant'; text: string; error?: boolean }

function SparkleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2l1.8 4.8L18.6 9 13.8 10.8 12 15.6 10.2 10.8 5.4 9l4.8-2.2L12 2z" fill="#fff" />
      <path d="M19 14l1 2.7L22.7 18 20 19l-1 2.7-1-2.7L15.3 18l2.7-1.3L19 14z" fill="#fff" />
    </svg>
  );
}

export default function AIChatSurface({ onClose, accent }: { onClose: () => void; accent: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: "Hi! I'm your financial guidance assistant. I can help you understand your alignment score, spending patterns, and goal progress. What would you like to know?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [shiftOn, setShiftOn] = useState(true);
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

  function keepInputFocus() {
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function tapKeyboardKey(key: string) {
    if (loading) return;
    if (key === 'backspace') {
      setInput(prev => prev.slice(0, -1));
      keepInputFocus();
      return;
    }
    if (key === 'space') {
      setInput(prev => `${prev} `);
      keepInputFocus();
      return;
    }
    if (key === 'return') {
      sendMessage(input);
      keepInputFocus();
      return;
    }
    if (key === 'shift') {
      setShiftOn(prev => !prev);
      keepInputFocus();
      return;
    }

    const letter = shiftOn ? key.toUpperCase() : key.toLowerCase();
    setInput(prev => `${prev}${letter}`);
    if (shiftOn) setShiftOn(false);
    keepInputFocus();
  }

  const keyboardHeight = 228;

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
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SparkleIcon size={18} /></div>
        </div>
      </div>

      {/* Messages */}
      <div ref={bottomRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', animation: 'chatMsgIn 0.22s ease' }}>
            {m.role === 'assistant' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', maxWidth: '88%' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 2 }}><SparkleIcon size={13} /></div>
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
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><SparkleIcon size={13} /></div>
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
      <div style={{ padding: '8px 16px 10px', flexShrink: 0, display: 'flex', gap: 10, alignItems: 'flex-end', background: '#FAF7F2' }}>
        <textarea ref={inputRef} className="chat-input" value={input}
          onFocus={() => setKeyboardOpen(true)}
          onBlur={() => setKeyboardOpen(false)}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey} placeholder="Ask about your finances…" rows={1}
          style={{ flex: 1, height: 44, padding: '11px 14px', borderRadius: 18, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 14, color: '#0F2A4A', fontFamily: 'inherit', resize: 'none', lineHeight: 1.5, overflow: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }} />
        <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
          style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', background: input.trim() && !loading ? accent : '#E2E8F0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M16 9L2 2l3.5 7L2 16l14-7z" fill={input.trim() && !loading ? '#fff' : '#94A3B8'} /></svg>
        </button>
      </div>

      {/* Simulated mobile keyboard for prototype behavior */}
      <div
        style={{ height: keyboardOpen ? keyboardHeight : 0, transition: 'height 0.2s ease', overflow: 'hidden', flexShrink: 0, background: '#D1D5DB', borderTop: keyboardOpen ? '1px solid #CBD5E1' : 'none' }}
        onMouseDown={e => e.preventDefault()}
      >
        <div style={{ padding: '8px 8px 10px', display: 'grid', gap: 6 }}>
          {[
            ['q','w','e','r','t','y','u','i','o','p'],
            ['a','s','d','f','g','h','j','k','l'],
            ['z','x','c','v','b','n','m'],
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              {row.map(k => (
                <button
                  key={k}
                  onClick={() => tapKeyboardKey(k)}
                  style={{ minWidth: 26, padding: '7px 8px', borderRadius: 6, border: 'none', background: '#fff', boxShadow: '0 1px 0 rgba(0,0,0,0.15)', fontSize: 12, fontWeight: 600, color: '#334155', textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {shiftOn ? k.toUpperCase() : k}
                </button>
              ))}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            <button onClick={() => tapKeyboardKey('shift')} style={{ width: 62, padding: '8px 0', borderRadius: 7, border: 'none', background: shiftOn ? accent : '#9CA3AF', color: '#fff', fontSize: 11, textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit' }}>shift</button>
            <button onClick={() => tapKeyboardKey('space')} style={{ width: 132, padding: '8px 0', borderRadius: 7, border: 'none', background: '#fff', boxShadow: '0 1px 0 rgba(0,0,0,0.15)', fontSize: 11, textAlign: 'center', color: '#334155', cursor: 'pointer', fontFamily: 'inherit' }}>space</button>
            <button onClick={() => tapKeyboardKey('backspace')} style={{ width: 72, padding: '8px 0', borderRadius: 7, border: 'none', background: '#9CA3AF', color: '#fff', fontSize: 11, textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit' }}>delete</button>
            <button onClick={() => tapKeyboardKey('return')} style={{ width: 72, padding: '8px 0', borderRadius: 7, border: 'none', background: accent, color: '#fff', fontSize: 11, textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit' }}>return</button>
          </div>
        </div>
      </div>
    </div>
  );
}
