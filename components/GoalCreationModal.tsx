'use client';
import { useState } from 'react';
import { GOAL_TEMPLATES, LINK_ACCOUNTS } from '../lib/data';
import type { Goal } from '../lib/data';

function fmtGoalAmt(n: number | string) {
  if (!n) return '';
  return '$' + Number(n).toLocaleString('en-US');
}

const STEPS = ['Template', 'Details', 'Accounts', 'Impact'];

export default function GoalCreationModal({ onClose, onSave, accent }: {
  onClose: () => void;
  onSave: (goal: Goal) => void;
  accent: string;
}) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [animating, setAnimating] = useState(false);
  const [template, setTemplate] = useState<typeof GOAL_TEMPLATES[0] | null>(null);
  const [customName, setCustomName] = useState('');
  const [targetAmt, setTargetAmt] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [monthly, setMonthly] = useState('');
  const [linked, setLinked] = useState<string[]>([]);
  const [impactReveal, setImpactReveal] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  function goTo(next: number, dir: number) {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); }, 220);
  }
  function next() { goTo(step + 1, 1); }
  function back() { goTo(step - 1, -1); }

  function pickTemplate(t: typeof GOAL_TEMPLATES[0]) {
    setTemplate(t);
    setTargetAmt(String(t.suggestAmt));
    setMonthly(String(Math.round(t.suggestAmt / (t.suggestYrs * 12))));
    const d = new Date();
    d.setFullYear(d.getFullYear() + t.suggestYrs);
    setTargetDate(d.toISOString().slice(0, 7));
    goTo(1, 1);
  }

  function toggleAcct(id: string) {
    setLinked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function handleSave() {
    setCelebrating(true);
    setTimeout(() => {
      const name = template?.id === 'custom' ? (customName || 'My Goal') : (template?.label ?? 'New Goal');
      onSave({
        id: Date.now(),
        emoji: template?.emoji ?? '⭐',
        label: name,
        target: Number(targetAmt) || 10000,
        current: 0,
        targetDate: new Date(targetDate + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        status: 'On Track',
        color: template?.color ?? accent,
        pct: 0,
      });
    }, 1600);
  }

  const monthlyNum = Number(monthly) || 0;
  const targetNum = Number(targetAmt) || 0;
  const monthsNeeded = monthlyNum > 0 ? Math.ceil(targetNum / monthlyNum) : null;
  const projDate = monthsNeeded ? (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsNeeded);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  })() : null;
  const scoreBoost = Math.min(Math.max(Math.floor(monthlyNum / 80), 2), 12);
  const tcolor = template?.color ?? accent;

  const canNext = [!!template, !!(targetAmt && targetDate), linked.length > 0, true][step] ?? false;

  if (celebrating) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, zIndex: 100 }}>
        <div style={{ fontSize: 64, marginBottom: 16, animation: 'goalBounce 0.6s ease' }}>🎉</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#0F2A4A', textAlign: 'center', marginBottom: 8 }}>Goal created!</div>
        <div style={{ fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 1.6, maxWidth: 260 }}>
          Your <strong style={{ color: tcolor }}>{template?.id === 'custom' ? (customName || 'goal') : (template?.label ?? 'goal')}</strong> goal is now live. We&apos;ll nudge you when you hit key milestones.
        </div>
        <div style={{ marginTop: 28, width: 200, height: 5, borderRadius: 99, background: '#E8F5F5', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: tcolor, borderRadius: 99, animation: 'goalLoadBar 1.4s ease forwards' }} />
        </div>
      </div>
    );
  }

  function renderStep() {
    if (step === 0) return (
      <div>
        <div style={{ fontSize: 21, fontWeight: 700, color: '#0F2A4A', marginBottom: 4 }}>What are you saving for?</div>
        <div style={{ fontSize: 13, color: '#64748B', marginBottom: 18, lineHeight: 1.5 }}>Pick a goal to get started. You&apos;ll customize it next.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {GOAL_TEMPLATES.map(t => {
            const sel = template?.id === t.id;
            return (
              <button key={t.id} onClick={() => pickTemplate(t)} style={{ padding: '14px 6px', borderRadius: 16, border: '2px solid ' + (sel ? t.color : '#E2E8F0'), background: sel ? t.color + '14' : '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, transition: 'all 0.15s', fontFamily: 'inherit' }}>
                <span style={{ fontSize: 24 }}>{t.emoji}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: sel ? t.color : '#0F2A4A', lineHeight: 1.3, textAlign: 'center' }}>{t.label}</span>
                <span style={{ fontSize: 10, color: '#64748B', lineHeight: 1.3, textAlign: 'center' }}>{t.sub}</span>
              </button>
            );
          })}
        </div>
      </div>
    );

    if (step === 1) return (
      <div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: tcolor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{template?.emoji ?? '⭐'}</div>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, color: '#0F2A4A' }}>{template?.id === 'custom' ? (customName || 'Your goal') : (template?.label ?? 'New Goal')}</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>{template?.sub ?? ''}</div>
          </div>
        </div>
        {template?.id === 'custom' && (
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#334155', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Goal name</label>
            <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g. Sabbatical fund" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 15, color: '#0F2A4A', fontFamily: 'inherit', outline: 'none', background: '#fff' }} />
          </div>
        )}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#334155', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Target amount</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, fontWeight: 600, color: '#64748B' }}>$</span>
            <input type="number" value={targetAmt} onChange={e => setTargetAmt(e.target.value)} placeholder="120,000" style={{ width: '100%', padding: '12px 14px 12px 28px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 18, fontWeight: 700, color: '#0F2A4A', fontFamily: "'DM Mono', monospace", outline: 'none', background: '#fff' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {template && [template.suggestAmt * 0.5, template.suggestAmt, template.suggestAmt * 1.5].map(v => (
              <button key={v} onClick={() => setTargetAmt(String(Math.round(v)))} style={{ flex: 1, padding: '6px 4px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', fontSize: 11, color: '#334155', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                {fmtGoalAmt(Math.round(v))}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#334155', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Target date</label>
          <input type="month" value={targetDate} onChange={e => setTargetDate(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 15, color: '#0F2A4A', fontFamily: 'inherit', outline: 'none', background: '#fff' }} />
        </div>
        <div style={{ marginBottom: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#334155', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Monthly contribution</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, fontWeight: 600, color: '#64748B' }}>$</span>
            <input type="number" value={monthly} onChange={e => setMonthly(e.target.value)} placeholder="500" style={{ width: '100%', padding: '12px 14px 12px 28px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 18, fontWeight: 700, color: '#0F2A4A', fontFamily: "'DM Mono', monospace", outline: 'none', background: '#fff' }} />
          </div>
          {monthly && targetAmt && monthsNeeded && (
            <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 10, background: tcolor + '12', fontSize: 13, color: tcolor, fontWeight: 500, lineHeight: 1.4 }}>
              At {fmtGoalAmt(monthly)}/mo → you&apos;ll reach {fmtGoalAmt(targetAmt)} in <strong>{monthsNeeded} months</strong>
            </div>
          )}
        </div>
      </div>
    );

    if (step === 2) return (
      <div>
        <div style={{ fontSize: 21, fontWeight: 700, color: '#0F2A4A', marginBottom: 4 }}>Link an account</div>
        <div style={{ fontSize: 13, color: '#64748B', marginBottom: 18, lineHeight: 1.5 }}>Which accounts count toward this goal? We track progress automatically.</div>
        {LINK_ACCOUNTS.map(a => {
          const sel = linked.includes(a.id);
          return (
            <div key={a.id} onClick={() => toggleAcct(a.id)} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 16px', borderRadius: 16, border: '2px solid ' + (sel ? tcolor : '#E2E8F0'), background: sel ? tcolor + '0D' : '#fff', marginBottom: 10, cursor: 'pointer', transition: 'all 0.15s' }}>
              <span style={{ fontSize: 24 }}>{a.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F2A4A' }}>{a.label}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>{a.balance} available</div>
              </div>
              <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid ' + (sel ? tcolor : '#CBD5E1'), background: sel ? tcolor : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                {sel && <svg width="12" height="12" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
            </div>
          );
        })}
        <button style={{ width: '100%', padding: '14px', borderRadius: 14, border: '1.5px dashed #CBD5E1', background: 'transparent', color: '#64748B', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}>+ Link a new account</button>
      </div>
    );

    if (step === 3) return (
      <div>
        <div style={{ fontSize: 21, fontWeight: 700, color: '#0F2A4A', marginBottom: 4 }}>Your goal impact</div>
        <div style={{ fontSize: 13, color: '#64748B', marginBottom: 18, lineHeight: 1.5 }}>Here&apos;s what this goal means for your financial picture.</div>
        <div style={{ background: tcolor, borderRadius: 20, padding: '18px', color: '#fff', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -24, right: -24, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, position: 'relative' }}>
            <span style={{ fontSize: 28 }}>{template?.emoji ?? '⭐'}</span>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{template?.id === 'custom' ? (customName || 'My Goal') : (template?.label ?? 'New Goal')}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Target: {fmtGoalAmt(targetAmt)}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, position: 'relative' }}>
            <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 12, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, opacity: 0.8, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>Monthly</div>
              <div style={{ fontSize: 19, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtGoalAmt(monthly)}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 12, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, opacity: 0.8, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>On track by</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{projDate ?? '—'}</div>
            </div>
          </div>
        </div>
        {!impactReveal ? (
          <button onClick={() => setImpactReveal(true)} style={{ width: '100%', padding: '16px', borderRadius: 16, background: '#0F2A4A', border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span>✨</span> Reveal goal impact
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Alignment Score boost', value: '+' + scoreBoost + ' pts', sub: 'Your score rises as you hit this saving pace', icon: '📈', delay: 0 },
              { label: 'New score (projected)', value: (74 + scoreBoost) + ' / 100', sub: 'Based on your current trajectory', icon: '🎯', delay: 80 },
              { label: 'Impact on other goals', value: 'Manageable', sub: 'Your cashflow comfortably supports this', icon: '⚖️', delay: 160 },
            ].map(card => (
              <div key={card.label} style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', animation: `goalSlideUp 0.35s ease ${card.delay}ms both` }}>
                <span style={{ fontSize: 24 }}>{card.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{card.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0F2A4A', marginTop: 2 }}>{card.value}</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>{card.sub}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
    return null;
  }

  const animStyle = animating
    ? (direction > 0 ? 'goalSlideOutL 0.18s ease forwards' : 'goalSlideOutR 0.18s ease forwards')
    : (direction > 0 ? 'goalSlideInR 0.22s ease' : 'goalSlideInL 0.22s ease');

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,42,74,0.5)', zIndex: 60, display: 'flex', alignItems: 'flex-end' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#FAF7F2', borderRadius: '28px 28px 0 0', width: '100%', maxHeight: '91%', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(0,0,0,0.2)', animation: 'goalSlideUp 0.28s ease' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: '#CBD5E1', margin: '0 auto 14px' }} />
          <div style={{ display: 'flex', gap: 5, marginBottom: 16 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= step ? tcolor : '#E2E8F0', transition: 'background 0.3s' }} />
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 4px' }}>
          <div style={{ animation: animStyle }}>{renderStep()}</div>
        </div>
        <div style={{ padding: '14px 20px 32px', flexShrink: 0, display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button onClick={back} style={{ padding: '14px 18px', borderRadius: 14, border: '1.5px solid #CBD5E1', background: 'transparent', color: '#334155', fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>←</button>
          )}
          {step < 3 ? (
            <button onClick={next} disabled={!canNext} style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: canNext ? tcolor : '#CBD5E1', color: canNext ? '#fff' : '#94A3B8', fontSize: 15, fontWeight: 700, cursor: canNext ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all 0.2s' }}>
              {step === 0 ? 'Choose this goal' : step === 2 ? 'See my impact →' : 'Continue →'}
            </button>
          ) : (
            <button onClick={handleSave} style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: tcolor, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Add this goal ✓</button>
          )}
        </div>
      </div>
    </div>
  );
}
