'use client';
import { useEffect, useState } from 'react';
import { CATEGORY_DATA } from '../lib/data';
import type { Txn } from '../lib/data';

const alignColors: Record<string, string> = { aligned: '#15803D', neutral: '#64748B', 'out-of-sync': '#B45309' };
const alignBgs: Record<string, string>    = { aligned: '#DCFCE7', neutral: '#F1F5F9', 'out-of-sync': '#FEF3C7' };

export default function SpendingDrilldown({ category, onClose, onTxnTap, accent }: {
  category: string;
  onClose: () => void;
  onTxnTap: (t: Txn) => void;
  accent: string;
}) {
  const [entering, setEntering] = useState(true);
  const data = CATEGORY_DATA[category];

  useEffect(() => {
    const t = setTimeout(() => setEntering(false), 50);
    return () => clearTimeout(t);
  }, []);

  if (!data) return null;

  const maxSpent  = Math.max(...data.months.map(m => m.spent), data.budget);
  const avgSpend  = Math.round(data.months.reduce((s, m) => s + m.spent, 0) / data.months.length);
  const currentMo = data.months.find(m => m.current);
  const over      = currentMo && currentMo.spent > data.budget;
  const pct       = currentMo ? Math.round((currentMo.spent / data.budget) * 100) : 0;
  const catColor  = data.align === 'out-of-sync' ? '#B45309' : data.color;

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#FAF7F2', zIndex: 65, display: 'flex', flexDirection: 'column', animation: 'sdSlideIn 0.28s cubic-bezier(.2,.8,.4,1)' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 0', flexShrink: 0, background: '#FAF7F2' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.1)' }}>←</button>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: catColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{data.icon}</div>
            <div><div style={{ fontSize: 20, fontWeight: 700, color: '#0F2A4A' }}>{category}</div><div style={{ fontSize: 12, color: '#64748B' }}>Pace: ${data.budget}/mo</div></div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 99, background: alignBgs[data.align], color: alignColors[data.align], fontWeight: 700 }}>
              {data.align === 'out-of-sync' ? 'Out of sync' : data.align === 'aligned' ? 'Aligned' : 'Neutral'}
            </span>
          </div>
        </div>

        {/* Hero */}
        <div style={{ background: catColor, borderRadius: 20, padding: '18px 20px', color: '#fff', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.75, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>May spending</div>
          <div style={{ fontSize: 38, fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginBottom: 6 }}>${currentMo ? currentMo.spent.toLocaleString() : 0}</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div><div style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>vs. pace</div><div style={{ fontSize: 14, fontWeight: 700 }}>{over ? '+$' + (currentMo!.spent - data.budget) + ' over' : '-$' + (data.budget - (currentMo?.spent ?? 0)) + ' under'}</div></div>
            <div><div style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>6-mo avg</div><div style={{ fontSize: 14, fontWeight: 700 }}>${avgSpend}</div></div>
            <div><div style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>of budget</div><div style={{ fontSize: 14, fontWeight: 700 }}>{pct}%</div></div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }}>
        {/* Bar chart */}
        <div style={{ background: '#fff', borderRadius: 18, padding: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 14, animation: 'sdFadeUp 0.3s ease 60ms both' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>6-month trend</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 72, marginBottom: 8 }}>
            {data.months.map((m, i) => {
              const barH = Math.round((m.spent / maxSpent) * 72);
              const isOver = m.spent > data.budget;
              const isCurr = !!m.current;
              return (
                <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: barH + 'px', background: isCurr ? catColor : isOver ? catColor + '80' : catColor + '40', position: 'relative', transition: 'height 0.6s ease', animation: `sdFadeUp 0.5s ease ${i * 50}ms both` }}>
                    {isCurr && <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', fontSize: 10, fontWeight: 700, color: catColor, whiteSpace: 'nowrap' }}>${m.spent}</div>}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'space-around', marginBottom: 4 }}>
            {data.months.map(m => <div key={m.month} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: m.current ? catColor : '#94A3B8', fontWeight: m.current ? 700 : 400 }}>{m.month}</div>)}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
            <div style={{ width: 20, height: 2, borderRadius: 99, background: '#CBD5E1' }} />
            <span style={{ fontSize: 11, color: '#64748B' }}>Budget: ${data.budget}/mo</span>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: catColor + '40', marginLeft: 8 }} />
            <span style={{ fontSize: 11, color: '#64748B' }}>Actual</span>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: catColor, marginLeft: 4 }} />
            <span style={{ fontSize: 11, color: '#64748B' }}>This month</span>
          </div>
        </div>

        {/* Goal impact */}
        <div style={{ borderRadius: 16, padding: '14px 16px', marginBottom: 14, background: data.goalImpact.status === 'behind' ? '#FEF3C7' : '#F0FDF4', animation: 'sdFadeUp 0.3s ease 100ms both' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 22 }}>{data.goalImpact.goalEmoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: data.goalImpact.status === 'behind' ? '#B45309' : '#15803D', marginBottom: 3 }}>{data.goalImpact.goalLabel}</div>
              <p style={{ fontSize: 12, color: data.goalImpact.status === 'behind' ? '#92400E' : '#166534', lineHeight: 1.55 }}>{data.goalImpact.note}</p>
            </div>
            <span style={{ fontSize: 16 }}>{data.goalImpact.status === 'behind' ? '⚡' : '✅'}</span>
          </div>
        </div>

        {/* AI insight */}
        <div style={{ background: '#0F2A4A', borderRadius: 16, padding: '14px 16px', marginBottom: 14, display: 'flex', gap: 10, animation: 'sdFadeUp 0.3s ease 140ms both' }}>
          <span style={{ fontSize: 18 }}>💬</span>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>{data.insight}</p>
        </div>

        {/* Transactions */}
        <div style={{ animation: 'sdFadeUp 0.3s ease 180ms both' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Transactions this month</div>
          {data.txns.map((t, i) => (
            <div key={t.id} onClick={() => onTxnTap({ ...t, id: parseInt(t.id.replace(/\D/g, '')) || 4 } as Txn)}
              style={{ background: '#fff', borderRadius: 14, padding: '13px 15px', marginBottom: 8, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', animation: `sdFadeUp 0.28s ease ${200 + i * 50}ms both` }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: catColor + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{data.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0F2A4A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.merchant}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0F2A4A', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(t.amount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.align === 'aligned' ? '#15803D' : t.align === 'out-of-sync' ? '#B45309' : '#CBD5E1', display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#64748B' }}>{t.acct}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#64748B' }}>{t.date}</span>
                </div>
              </div>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.3, flexShrink: 0 }}><path d="M4 2l4 4-4 4" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          ))}
        </div>

        {/* Recovery prompt */}
        {data.align === 'out-of-sync' && (
          <div style={{ background: catColor + '10', borderRadius: 16, padding: '16px', marginTop: 4, animation: 'sdFadeUp 0.3s ease 300ms both' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: catColor, marginBottom: 8 }}>Want to get back on track?</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[50, 100, 140].map(cut => (
                <div key={cut} style={{ flex: 1, background: '#fff', borderRadius: 12, padding: '10px 8px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0F2A4A' }}>-${cut}</div>
                  <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>saves</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#15803D', marginTop: 1 }}>~{Math.round(cut * 0.4)} days</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 8, textAlign: 'center' }}>Days recovered on Home Down Payment goal</div>
          </div>
        )}
      </div>
    </div>
  );
}
