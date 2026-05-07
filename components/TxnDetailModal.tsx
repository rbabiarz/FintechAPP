'use client';
import { useState } from 'react';
import { TXN_GOAL_IMPACT } from '../lib/data';
import type { Txn } from '../lib/data';

const alignColors: Record<string, string> = { aligned: '#15803D', neutral: '#64748B', 'out-of-sync': '#B45309' };
const alignBgs: Record<string, string>    = { aligned: '#DCFCE7', neutral: '#F1F5F9', 'out-of-sync': '#FEF3C7' };
const alignLabel: Record<string, string>  = { aligned: 'Aligned',  neutral: 'Neutral',  'out-of-sync': 'Out of sync' };
const CATS = ['Groceries','Dining','Coffee','Transport','Health','Subscriptions','Shopping','Income','Other'];

function shiftLabel(days: number, dir: string) {
  if (dir === 'none' || days === 0) return { text: 'No change', color: '#64748B' };
  if (dir === 'ahead') return { text: Math.abs(days) + ' days earlier', color: '#15803D' };
  return { text: days + ' days later', color: '#B45309' };
}

function ShiftArrow({ dir }: { dir: string }) {
  if (dir === 'ahead')  return <span style={{ fontSize: 16, color: '#15803D' }}>↑</span>;
  if (dir === 'behind') return <span style={{ fontSize: 16, color: '#B45309' }}>↓</span>;
  return <span style={{ fontSize: 16, color: '#CBD5E1' }}>—</span>;
}

export default function TxnDetailModal({ txn, onClose, accent }: { txn: Txn; onClose: () => void; accent: string }) {
  const [tab, setTab] = useState<'impact' | 'details'>('impact');
  const [whyOpen, setWhyOpen] = useState<number | null>(null);
  const [selectedCat, setSelectedCat] = useState(txn.cat);
  const [recatDone, setRecatDone] = useState(false);

  const impact = TXN_GOAL_IMPACT[txn.id] ?? { type: txn.align, summary: 'No detailed impact data for this transaction.', goalShifts: [], monthlyContext: null, tip: null };
  const aColor = alignColors[txn.align] ?? '#64748B';
  const aBg    = alignBgs[txn.align]    ?? '#F1F5F9';

  function doRecat(cat: string) {
    setSelectedCat(cat);
    setRecatDone(true);
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,42,74,0.45)', zIndex: 70, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#FAF7F2', borderRadius: '28px 28px 0 0', maxHeight: '88%', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', animation: 'txnSlideUp 0.3s cubic-bezier(.2,.8,.4,1)' }} onClick={e => e.stopPropagation()}>

        <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: '#CBD5E1', margin: '0 auto 14px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0F2A4A', marginBottom: 3 }}>{txn.merchant}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, padding: '3px 9px', borderRadius: 99, background: aBg, color: aColor, fontWeight: 600 }}>{alignLabel[txn.align]}</span>
                <span style={{ fontSize: 12, color: '#64748B' }}>{selectedCat}</span>
                <span style={{ fontSize: 12, color: '#64748B' }}>·</span>
                <span style={{ fontSize: 12, color: '#64748B' }}>{txn.date}</span>
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: txn.amount > 0 ? '#15803D' : '#0F2A4A', fontVariantNumeric: 'tabular-nums', marginLeft: 12 }}>
              {txn.amount > 0 ? '+' : ''}{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(txn.amount)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 0, background: '#F1F5F9', borderRadius: 12, padding: 3, marginBottom: 2 }}>
            {(['impact', 'details'] as const).map((id) => (
              <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: '8px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, transition: 'all 0.18s', background: tab === id ? '#fff' : 'transparent', color: tab === id ? '#0F2A4A' : '#64748B', boxShadow: tab === id ? '0 1px 6px rgba(0,0,0,0.1)' : 'none' }}>
                {id === 'impact' ? 'Goal Impact' : 'Details'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 8px' }}>
          {tab === 'impact' && (
            <div style={{ animation: 'txnFadeIn 0.22s ease' }}>
              <div style={{ background: aBg, borderRadius: 14, padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20 }}>{txn.align === 'aligned' ? '✅' : txn.align === 'out-of-sync' ? '⚡' : 'ℹ️'}</span>
                <p style={{ fontSize: 13, color: aColor, lineHeight: 1.55, fontWeight: 500 }}>{impact.summary}</p>
              </div>
              {impact.monthlyContext && (
                <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>{impact.monthlyContext.cat} — May</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: '#334155' }}>Spent so far</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: impact.monthlyContext.pct > 100 ? '#B45309' : '#0F2A4A', fontVariantNumeric: 'tabular-nums' }}>${impact.monthlyContext.spent}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 99, background: '#F1F5F9', overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ height: '100%', borderRadius: 99, width: Math.min(impact.monthlyContext.pct, 100) + '%', background: impact.monthlyContext.pct > 100 ? '#B45309' : (accent || '#2C7A7B'), transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#64748B' }}>{impact.monthlyContext.pct}% of ${impact.monthlyContext.budget} pace</span>
                    {impact.monthlyContext.pct > 100 && <span style={{ fontSize: 11, color: '#B45309', fontWeight: 600 }}>${impact.monthlyContext.spent - impact.monthlyContext.budget} over</span>}
                  </div>
                </div>
              )}
              {impact.goalShifts.length > 0 && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Goal timeline shifts</div>
                  {impact.goalShifts.map((gs, idx) => {
                    const sl = shiftLabel(gs.shiftDays, gs.shiftDir);
                    const open = whyOpen === gs.goalId;
                    return (
                      <div key={gs.goalId} style={{ background: '#fff', borderRadius: 16, marginBottom: 10, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflow: 'hidden', animation: `txnFadeIn 0.28s ease ${idx * 60}ms both` }}>
                        <div style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: gs.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{gs.emoji}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#0F2A4A', marginBottom: 2 }}>{gs.label}</div>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <ShiftArrow dir={gs.shiftDir} />
                                <span style={{ fontSize: 13, fontWeight: 600, color: sl.color }}>{sl.text}</span>
                              </div>
                            </div>
                            <button onClick={() => setWhyOpen(open ? null : gs.goalId)} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #E2E8F0', background: open ? '#0F2A4A' : '#fff', color: open ? '#fff' : '#64748B', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, transition: 'all 0.15s' }}>Why?</button>
                          </div>
                          {open && (
                            <div style={{ marginTop: 12, padding: '12px', borderRadius: 10, background: '#F8FAFC', animation: 'txnFadeIn 0.2s ease' }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: gs.color, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>How we calculated this</div>
                              <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.65 }}>{gs.note}</p>
                              {gs.shiftDir === 'behind' && (
                                <div style={{ marginTop: 10, padding: '10px', borderRadius: 8, background: gs.color + '10', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                  <span style={{ fontSize: 14 }}>💡</span>
                                  <p style={{ fontSize: 12, color: gs.color, lineHeight: 1.5, fontWeight: 500 }}>Reducing this category by $50/mo would recover approximately {Math.round(gs.shiftDays * 0.4)} days of lost progress.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {gs.shiftDays > 0 && (
                          <div style={{ height: 3, background: '#F1F5F9' }}>
                            <div style={{ height: '100%', width: Math.min(gs.shiftDays / 90 * 100, 100) + '%', background: gs.shiftDir === 'ahead' ? '#15803D' : '#B45309', borderRadius: 99, transition: 'width 0.8s ease' }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
              {impact.tip && (
                <div style={{ background: '#0F2A4A', borderRadius: 14, padding: '14px 16px', marginBottom: 4, display: 'flex', gap: 10, alignItems: 'flex-start', animation: 'txnFadeIn 0.3s ease 180ms both' }}>
                  <span style={{ fontSize: 18 }}>💬</span>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>{impact.tip}</p>
                </div>
              )}
            </div>
          )}

          {tab === 'details' && (
            <div style={{ animation: 'txnFadeIn 0.22s ease' }}>
              <div style={{ background: '#fff', borderRadius: 16, padding: '4px 0', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', marginBottom: 14 }}>
                {[
                  { label: 'Merchant', value: txn.merchant },
                  { label: 'Amount', value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(Math.abs(txn.amount)) },
                  { label: 'Date', value: txn.date },
                  { label: 'Account', value: txn.acct },
                  { label: 'Category', value: selectedCat + (recatDone ? ' ✓' : '') },
                  { label: 'Alignment', value: alignLabel[txn.align] },
                ].map((row, i, arr) => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < arr.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                    <span style={{ fontSize: 13, color: '#64748B' }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: row.label === 'Alignment' ? aColor : '#0F2A4A' }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Recategorize</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
                {CATS.map(c => (
                  <button key={c} onClick={() => doRecat(c)} style={{ padding: '7px 12px', borderRadius: 99, border: '1.5px solid ' + (selectedCat === c ? (accent || '#2C7A7B') : '#E2E8F0'), background: selectedCat === c ? (accent || '#2C7A7B') + '12' : '#fff', color: selectedCat === c ? (accent || '#2C7A7B') : '#334155', fontSize: 12, fontWeight: selectedCat === c ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>{c}</button>
                ))}
              </div>
              <div style={{ background: '#F0FDF4', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#15803D', lineHeight: 1.5 }}>
                <strong>Auto-learn:</strong> Want us to always categorize {txn.merchant} as {selectedCat}? We'll remember your choice.
                <button style={{ display: 'block', marginTop: 8, padding: '8px 14px', borderRadius: 8, background: '#15803D', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Yes, always do this</button>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px 32px', flexShrink: 0 }}>
          <button onClick={onClose} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: '#0F2A4A', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Done</button>
        </div>
      </div>
    </div>
  );
}
