'use client';
import { useState } from 'react';
import { T } from '../lib/tokens';
import { GOALS, TXNS, ALERTS, HOLDINGS } from '../lib/data';
import type { Goal, Txn } from '../lib/data';
import AIChatSurface from '../components/AIChatSurface';
import GoalCreationModal from '../components/GoalCreationModal';
import TxnDetailModal from '../components/TxnDetailModal';
import SpendingDrilldown from '../components/SpendingDrilldown';
import OnboardingFlow from '../components/OnboardingFlow';

const fmt  = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const fmtD = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

/* ── Shared UI ── */
function AlignDot({ align }: { align: string }) {
  const colors: Record<string, string> = { aligned: T.success, neutral: T.slate300, 'out-of-sync': T.caution };
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: colors[align] ?? T.slate300, flexShrink: 0 }} />;
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    'On Track':        { bg: T.successBg, color: T.success },
    'Ahead':           { bg: '#DBEAFE',   color: '#1D4ED8' },
    'Slightly Behind': { bg: T.cautionBg, color: T.caution },
    'At Risk':         { bg: '#FEE2E2',   color: T.error },
    'Paused':          { bg: T.slate100,  color: T.slate500 },
  };
  const s = map[status] ?? map['On Track'];
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: s.bg, color: s.color, letterSpacing: '0.02em' }}>{status}</span>;
}

function ProgressBar({ pct, color }: { pct: number; color?: string }) {
  return (
    <div style={{ height: 6, borderRadius: 99, background: T.slate100, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: 99, background: color ?? T.teal600, transition: 'width 0.6s ease' }} />
    </div>
  );
}

function WhyDrawer({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: T.white, borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', boxShadow: '0 -8px 32px rgba(0,0,0,0.14)', zIndex: 50 }} onClick={e => e.stopPropagation()}>
      <div style={{ width: 36, height: 4, borderRadius: 99, background: T.slate300, margin: '0 auto 20px' }} />
      <div style={{ fontSize: 11, fontWeight: 700, color: T.teal600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>How we calculated this</div>
      <p style={{ fontSize: 14, color: T.slate700, lineHeight: 1.65 }}>{text}</p>
      <button onClick={onClose} style={{ marginTop: 20, width: '100%', padding: '12px', borderRadius: 12, border: `1.5px solid ${T.slate300}`, background: 'transparent', color: T.slate700, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Got it</button>
    </div>
  );
}

/* ── Goals Tab ── */
function GoalsTab({ onGoalTap, onAddGoal, extraGoals, accent, persona }: {
  onGoalTap: (g: Goal) => void; onAddGoal: () => void; extraGoals: Goal[]; accent: string; persona: string;
}) {
  const [showWhy, setShowWhy] = useState(false);
  const [scoreBreakdown, setScoreBreakdown] = useState(false);

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: T.sand50 }}>
      <div style={{ padding: '16px 20px 0', background: T.sand50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 13, color: T.slate500, fontWeight: 500 }}>Good morning,</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.navy900, lineHeight: 1.2 }}>{persona} 👋</div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', fontWeight: 700 }}>{persona[0]}</div>
        </div>
      </div>

      {/* Alignment Score */}
      <div style={{ margin: '16px 20px 0', background: T.white, borderRadius: 20, padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'pointer' }} onClick={() => setScoreBreakdown(!scoreBreakdown)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.slate500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Goal Alignment Score</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 40, fontWeight: 700, color: accent, fontVariantNumeric: 'tabular-nums' }}>74</span>
              <span style={{ fontSize: 14, color: T.success, fontWeight: 600 }}>↑ +3 this month</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[74, 68, 71, 65, 70, 74].map((v, i) => (
              <div key={i} style={{ width: 6, borderRadius: 99, background: i === 5 ? accent : T.teal100, height: `${(v / 100) * 48}px`, alignSelf: 'flex-end' }} />
            ))}
          </div>
        </div>
        {scoreBreakdown && (
          <div style={{ marginTop: 16, borderTop: `1px solid ${T.slate100}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Savings Rate Consistency', score: 82, color: T.success },
              { label: 'Spending Alignment',       score: 68, color: T.caution },
              { label: 'Investment Fit',            score: 70, color: accent },
              { label: 'Debt Trajectory',           score: 80, color: T.success },
            ].map(c => (
              <div key={c.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: T.slate700, fontWeight: 500 }}>{c.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{c.score}</span>
                </div>
                <ProgressBar pct={c.score} color={c.color} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account strip */}
      <div style={{ margin: '12px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[{ label: 'Net Worth', value: '$248,600', delta: '+2.1%' }, { label: 'Total Liquid', value: '$48,200', delta: '+$800' }, { label: 'Total Debt', value: '$0', delta: '—' }].map(a => (
          <div key={a.label} style={{ background: T.white, borderRadius: 14, padding: '12px 10px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 10, color: T.slate500, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>{a.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy900, fontVariantNumeric: 'tabular-nums' }}>{a.value}</div>
            <div style={{ fontSize: 11, color: T.success, fontWeight: 500 }}>{a.delta}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '20px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.navy900 }}>Your Goals</div>
        <button onClick={onAddGoal} style={{ fontSize: 13, color: accent, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>+ Add goal</button>
      </div>
      {[...GOALS, ...extraGoals].map(g => (
        <div key={g.id} onClick={() => onGoalTap(g)} style={{ margin: '0 20px 12px', background: T.white, borderRadius: 20, padding: '18px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: g.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{g.emoji}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.navy900, lineHeight: 1.2 }}>{g.label}</div>
                <div style={{ fontSize: 12, color: T.slate500, marginTop: 2 }}>Target: {g.targetDate}</div>
              </div>
            </div>
            <StatusPill status={g.status} />
          </div>
          <ProgressBar pct={g.pct} color={g.color} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.navy900, fontVariantNumeric: 'tabular-nums' }}>{fmt(g.current)}</span>
            <span style={{ fontSize: 13, color: T.slate500 }}>{g.pct}% of {fmt(g.target)}</span>
          </div>
        </div>
      ))}

      <div style={{ margin: '4px 20px 24px', background: T.navy900, borderRadius: 20, padding: '20px', color: T.white, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(44,122,123,0.2)' }} />
        <div style={{ fontSize: 11, fontWeight: 700, color: T.teal100, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Next Best Action</div>
        <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5, marginBottom: 16, position: 'relative', zIndex: 1 }}>
          Increase your monthly savings from <span style={{ color: T.teal400 }}>$400 → $600</span> to reach your home goal <strong>8 months sooner</strong>.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ flex: 1, padding: '10px', borderRadius: 10, background: accent, border: 'none', color: T.white, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Explore this</button>
          <button onClick={() => setShowWhy(true)} style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: 'none', color: T.white, fontWeight: 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Why?</button>
        </div>
      </div>

      {showWhy && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowWhy(false)}>
          <WhyDrawer text="Your current savings velocity is $400/month into the home goal. Your target is $120,000 by August 2027 — 27 months away. At $400/month, you'd reach $48,200 + ($400 × 27) = $59,000, falling $61,000 short. Increasing to $600/month closes the gap entirely and creates a buffer, moving your expected completion to December 2026 — 8 months ahead." onClose={() => setShowWhy(false)} />
        </div>
      )}
    </div>
  );
}

/* ── Goal Detail ── */
function GoalDetail({ goal, onBack, onDelete, onEdit, accent }: {
  goal: Goal; onBack: () => void; onDelete: (id: number) => void; onEdit: (g: Goal) => void; accent: string;
}) {
  const [showWhy, setShowWhy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState({ label: goal.label, target: String(goal.target), targetDate: goal.targetDate, linked: ['chase'] });
  const [editSaved, setEditSaved] = useState(false);

  const months = Array.from({ length: 12 }, (_, i) => {
    const base = goal.current * (i / 11);
    return Math.round(base + Math.random() * 2000);
  });

  function handleEditSave() {
    setEditSaved(true);
    setTimeout(() => {
      setEditSaved(false);
      setShowEdit(false);
      onEdit({ ...goal, label: editData.label, target: Number(editData.target) || goal.target, targetDate: editData.targetDate });
    }, 800);
  }

  function toggleLinked(id: string) {
    setEditData(prev => ({ ...prev, linked: prev.linked.includes(id) ? prev.linked.filter(x => x !== id) : [...prev.linked, id] }));
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: T.sand50, position: 'relative' }}>
      <div style={{ padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center', background: T.sand50, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', background: T.white, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.1)' }}>←</button>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.navy900, flex: 1 }}>{goal.label}</div>
        <button onClick={() => setShowEdit(true)} style={{ width: 36, height: 36, borderRadius: '50%', background: T.teal50, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', marginRight: 4 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13H3v-2L11.5 2.5z" stroke="#2C7A7B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button onClick={() => setConfirmDelete(true)} style={{ width: 36, height: 36, borderRadius: '50%', background: '#FEE2E2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5V4M6 7v5M10 7v5M3 4l1 9.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5L13 4" stroke="#B91C1C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      {confirmDelete && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,42,74,0.45)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }} onClick={() => setConfirmDelete(false)}>
          <div style={{ background: T.white, borderRadius: '24px 24px 0 0', width: '100%', padding: '20px 20px 36px', boxShadow: '0 -8px 32px rgba(0,0,0,0.15)', animation: 'confirmSlideUp 0.25s cubic-bezier(.2,.8,.4,1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: T.slate300, margin: '0 auto 20px' }} />
            <div style={{ width: 52, height: 52, borderRadius: 16, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="26" height="26" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5V4M6 7v5M10 7v5M3 4l1 9.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5L13 4" stroke="#B91C1C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.navy900, textAlign: 'center', marginBottom: 8 }}>Delete this goal?</div>
            <p style={{ fontSize: 14, color: T.slate500, textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}><strong style={{ color: T.navy900 }}>{goal.label}</strong> and all its progress data will be permanently removed. This can't be undone.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: '14px', borderRadius: 14, border: `1.5px solid ${T.slate300}`, background: 'transparent', color: T.slate700, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Keep goal</button>
              <button onClick={() => { setConfirmDelete(false); onDelete(goal.id); }} style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: T.error, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ margin: '0 20px', background: T.white, borderRadius: 20, padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: accent, fontVariantNumeric: 'tabular-nums' }}>{fmt(goal.current)}</div>
          <StatusPill status={goal.status} />
        </div>
        <ProgressBar pct={goal.pct} color={goal.color} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: T.slate500 }}>Target: {fmt(goal.target)}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: goal.color }}>{goal.pct}% complete</span>
        </div>
        <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 48, marginTop: 4 }}>
          {months.map((v, i) => (
            <div key={i} style={{ flex: 1, borderRadius: 4, background: i === 11 ? accent : T.teal100, height: `${(v / Math.max(...months)) * 48}px`, transition: 'height 0.3s' }} />
          ))}
        </div>
        <div style={{ fontSize: 11, color: T.slate500, textAlign: 'center', marginTop: 4 }}>12-month contribution history</div>
      </div>

      <div style={{ margin: '12px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[{ label: 'Monthly avg', value: '+$420', sub: 'contributions' }, { label: 'On track by', value: goal.targetDate, sub: 'at current pace' }, { label: 'Remaining', value: fmt(goal.target - goal.current), sub: 'to goal' }, { label: 'Months left', value: '27', sub: 'to target date' }].map(s => (
          <div key={s.label} style={{ background: T.white, borderRadius: 14, padding: '14px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 11, color: T.slate500, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.navy900, margin: '4px 0 2px', fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: T.slate500 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ margin: '12px 20px 24px', background: T.navy900, borderRadius: 20, padding: '18px', color: T.white }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.teal100, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>3 Scenarios</div>
        {[
          { label: 'Conservative (2% return)', value: fmt(goal.current * 1.24), color: T.teal100 },
          { label: 'Expected (5% return)',     value: fmt(goal.current * 1.32), color: T.teal400 },
          { label: 'Optimistic (8% return)',   value: fmt(goal.current * 1.42), color: '#6EE7B7' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{s.label}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</span>
          </div>
        ))}
        <button onClick={() => setShowWhy(true)} style={{ marginTop: 12, fontSize: 12, color: T.teal100, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>How are these calculated? →</button>
      </div>

      {showEdit && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,42,74,0.45)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowEdit(false)}>
          <div style={{ background: '#FAF7F2', borderRadius: '24px 24px 0 0', width: '100%', maxHeight: '88%', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', animation: 'confirmSlideUp 0.28s cubic-bezier(.2,.8,.4,1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: '#CBD5E1', margin: '0 auto 16px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0F2A4A' }}>Edit goal</div>
                <div style={{ fontSize: 13, color: '#64748B' }}>{goal.emoji} {editData.label}</div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 4px' }}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#334155', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Goal name</label>
                <input value={editData.label} onChange={e => setEditData(p => ({ ...p, label: e.target.value }))} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 15, fontWeight: 600, color: '#0F2A4A', fontFamily: 'inherit', outline: 'none', background: '#fff' }} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#334155', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Target amount</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, fontWeight: 600, color: '#64748B' }}>$</span>
                  <input type="number" value={editData.target} onChange={e => setEditData(p => ({ ...p, target: e.target.value }))} style={{ width: '100%', padding: '12px 14px 12px 28px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 18, fontWeight: 700, color: '#0F2A4A', fontFamily: "'DM Mono',monospace", outline: 'none', background: '#fff' }} />
                </div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#334155', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Target date</label>
                <input value={editData.targetDate} onChange={e => setEditData(p => ({ ...p, targetDate: e.target.value }))} placeholder="e.g. Aug 2027" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 15, color: '#0F2A4A', fontFamily: 'inherit', outline: 'none', background: '#fff' }} />
              </div>
              <div style={{ marginBottom: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#334155', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Linked accounts</label>
                {[{ id: 'chase', icon: '🏦', label: 'Chase Checking', balance: '$12,400' }, { id: 'fidelity', icon: '📈', label: 'Fidelity Brokerage', balance: '$72,400' }, { id: 'savings', icon: '💰', label: 'Chase Savings', balance: '$35,800' }].map(a => {
                  const sel = editData.linked.includes(a.id);
                  return (
                    <div key={a.id} onClick={() => toggleLinked(a.id)} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '13px 15px', borderRadius: 14, border: '2px solid ' + (sel ? (accent || '#2C7A7B') : '#E2E8F0'), background: sel ? (accent || '#2C7A7B') + '0D' : '#fff', marginBottom: 8, cursor: 'pointer', transition: 'all 0.15s' }}>
                      <span style={{ fontSize: 22 }}>{a.icon}</span>
                      <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: '#0F2A4A' }}>{a.label}</div><div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>{a.balance}</div></div>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid ' + (sel ? accent : '#CBD5E1'), background: sel ? accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}>
                        {sel && <svg width="12" height="12" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ padding: '14px 20px 32px', flexShrink: 0 }}>
              <button onClick={handleEditSave} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: editSaved ? '#15803D' : (accent || '#2C7A7B'), color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.25s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {editSaved ? <><svg width="18" height="18" viewBox="0 0 18 18"><polyline points="3,9 7,13 15,5" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg> Saved!</> : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWhy && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowWhy(false)}>
          <WhyDrawer text={`Projections are based on your current balance of ${fmt(goal.current)}, average monthly contribution of $420 over the last 90 days, and annualized return assumptions of 2% (conservative), 5% (expected), and 8% (optimistic). Return assumptions are disclosed for transparency. They represent historical ranges, not guarantees.`} onClose={() => setShowWhy(false)} />
        </div>
      )}
    </div>
  );
}

/* ── Money Tab ── */
function MoneyTab({ accent, onTxnTap, onCategoryTap }: { accent: string; onTxnTap: (t: Txn) => void; onCategoryTap: (cat: string) => void }) {
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Aligned', 'Out-of-sync', 'Groceries', 'Dining', 'Income'];
  const shown = TXNS.filter(t => {
    if (filter === 'All') return true;
    if (filter === 'Aligned') return t.align === 'aligned';
    if (filter === 'Out-of-sync') return t.align === 'out-of-sync';
    return t.cat === filter;
  });
  const alignDotColor: Record<string, string> = { aligned: T.success, neutral: T.slate300, 'out-of-sync': T.caution };
  const catEmoji: Record<string, string> = { Groceries: '🛒', Dining: '🍽️', Income: '💰', Health: '💪', Subscriptions: '📱', Coffee: '☕', Transport: '🚗' };

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: T.sand50, position: 'relative' }}>
      <div style={{ padding: '16px 20px 12px', background: T.sand50, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: T.navy900, marginBottom: 12 }}>Money</div>
        <div style={{ background: T.white, borderRadius: 16, padding: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.slate500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>May spending vs. aligned pace</div>
            <div style={{ fontSize: 11, color: T.slate500 }}>Tap to drill in →</div>
          </div>
          {[
            { cat: 'Groceries', spent: 210, budget: 280, align: 'aligned' },
            { cat: 'Dining', spent: 340, budget: 200, align: 'out-of-sync' },
            { cat: 'Transport', spent: 88, budget: 120, align: 'aligned' },
            { cat: 'Subscriptions', spent: 46, budget: 60, align: 'neutral' },
          ].map(c => (
            <div key={c.cat} onClick={() => onCategoryTap(c.cat)} style={{ marginBottom: 10, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: T.slate700 }}>{c.cat}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: c.align === 'out-of-sync' ? T.caution : T.slate700, fontVariantNumeric: 'tabular-nums' }}>${c.spent}</span>
              </div>
              <div style={{ height: 5, borderRadius: 99, background: T.slate100, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min((c.spent / c.budget) * 100, 100)}%`, borderRadius: 99, background: c.align === 'out-of-sync' ? T.caution : accent, transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ fontSize: 10, color: T.slate500, marginTop: 2 }}>Pace: ${c.budget}/mo {c.spent > c.budget && <span style={{ color: T.caution, fontWeight: 600 }}>· ${c.spent - c.budget} over</span>}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 99, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, background: filter === f ? accent : T.white, color: filter === f ? T.white : T.slate700, boxShadow: filter === f ? 'none' : '0 1px 4px rgba(0,0,0,0.08)', transition: 'all 0.15s' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '4px 20px 24px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.slate500, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Tap any transaction to see goal impact</div>
        {shown.map(t => (
          <div key={t.id} onClick={() => onTxnTap(t)} style={{ background: T.white, borderRadius: 16, padding: '14px 16px', marginBottom: 8, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: (alignDotColor[t.align] ?? T.slate300) + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 18 }}>{catEmoji[t.cat] ?? '💳'}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: T.navy900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.merchant}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: t.amount > 0 ? T.success : T.navy900, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{t.amount > 0 ? '+' : ''}{fmtD(t.amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, gap: 4 }}>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: alignDotColor[t.align] ?? T.slate300, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: T.slate500 }}>{t.cat}</span>
                </div>
                <span style={{ fontSize: 11, color: T.slate500 }}>{t.date}</span>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, opacity: 0.3 }}><path d="M5 3l4 4-4 4" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Invest Tab ── */
function InvestTab({ accent }: { accent: string }) {
  const [showWhy, setShowWhy] = useState(false);
  const totalValue = HOLDINGS.reduce((s, h) => s + h.value, 0);
  const colors = [accent, '#0369a1', '#7c3aed', '#15803D', T.slate300];
  let cumulative = 0;
  const segments = HOLDINGS.map((h, i) => { const start = cumulative; cumulative += h.pct; return { ...h, start, color: colors[i] }; });

  function polarToXY(angle: number, r = 40) { const rad = (angle - 90) * Math.PI / 180; return { x: 50 + r * Math.cos(rad), y: 50 + r * Math.sin(rad) }; }
  function describeArc(startPct: number, endPct: number) {
    const start = polarToXY(startPct * 3.6), end = polarToXY(endPct * 3.6);
    return `M ${start.x} ${start.y} A 40 40 0 ${endPct - startPct > 50 ? 1 : 0} 1 ${end.x} ${end.y}`;
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: T.sand50 }}>
      <div style={{ padding: '16px 20px 0' }}><div style={{ fontSize: 22, fontWeight: 700, color: T.navy900, marginBottom: 16 }}>Invest</div></div>
      <div style={{ margin: '0 20px', background: T.white, borderRadius: 20, padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
            <svg viewBox="0 0 100 100" width={110} height={110}>
              {segments.map((s, i) => s.pct === 0 ? null : <path key={i} d={describeArc(s.start, s.start + s.pct)} fill="none" stroke={s.color} strokeWidth="18" strokeLinecap="butt" />)}
              <circle cx="50" cy="50" r="27" fill={T.sand50} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy900, fontVariantNumeric: 'tabular-nums' }}>{fmt(totalValue)}</div>
              <div style={{ fontSize: 10, color: T.slate500 }}>total</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            {HOLDINGS.map((h, i) => (
              <div key={h.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: colors[i], flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: T.slate700 }}>{h.name.split('(')[0].trim()}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.navy900, fontVariantNumeric: 'tabular-nums' }}>{h.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ margin: '12px 20px 0', background: '#EFF6FF', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10 }}>
        <span style={{ fontSize: 16 }}>ℹ️</span>
        <p style={{ fontSize: 12, color: '#1D4ED8', lineHeight: 1.5 }}><strong>Educational reference only.</strong> Allocation insights are informational, not personalized investment advice. Always consult a licensed advisor for specific recommendations.</p>
      </div>

      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.navy900, marginBottom: 10 }}>Holdings vs. Reference</div>
        {HOLDINGS.map((h, i) => {
          const drift = h.pct - h.ref;
          return (
            <div key={h.name} style={{ background: T.white, borderRadius: 16, padding: '14px 16px', marginBottom: 8, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div><div style={{ fontSize: 14, fontWeight: 600, color: T.navy900 }}>{h.name}</div><div style={{ fontSize: 11, color: T.slate500, marginTop: 1 }}>Goal: {h.goal}</div></div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.navy900, fontVariantNumeric: 'tabular-nums' }}>{fmt(h.value)}</div>
                  <div style={{ fontSize: 11, color: Math.abs(drift) > 5 ? T.caution : T.success }}>{drift >= 0 ? '+' : ''}{drift}% vs ref</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: T.slate500, width: 42 }}>Actual</span>
                <div style={{ flex: 1, height: 5, borderRadius: 99, background: T.slate100, overflow: 'hidden' }}><div style={{ height: '100%', width: `${h.pct}%`, borderRadius: 99, background: colors[i] }} /></div>
                <span style={{ fontSize: 11, fontWeight: 600, color: T.navy900, width: 28, textAlign: 'right' }}>{h.pct}%</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                <span style={{ fontSize: 11, color: T.slate500, width: 42 }}>Ref.</span>
                <div style={{ flex: 1, height: 5, borderRadius: 99, background: T.slate100, overflow: 'hidden' }}><div style={{ height: '100%', width: `${h.ref}%`, borderRadius: 99, background: colors[i] + '60' }} /></div>
                <span style={{ fontSize: 11, color: T.slate500, width: 28, textAlign: 'right' }}>{h.ref}%</span>
              </div>
              {Math.abs(drift) > 5 && <div style={{ marginTop: 8, fontSize: 12, color: T.caution, background: T.cautionBg, borderRadius: 8, padding: '6px 10px', lineHeight: 1.4 }}>{drift > 0 ? '↑ Overweight' : '↓ Underweight'} by {Math.abs(drift)}% vs. educational reference for this timeline.</div>}
            </div>
          );
        })}
      </div>

      <div style={{ margin: '12px 20px 24px', background: T.navy900, borderRadius: 20, padding: '20px', color: T.white }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.teal100, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Retirement Projection (Age 65)</div>
        {[{ label: 'Conservative', value: '$820K', color: T.teal100 }, { label: 'Expected', value: '$1.24M', color: T.teal400 }, { label: 'Optimistic', value: '$1.89M', color: '#6EE7B7' }].map(p => (
          <div key={p.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{p.label}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: p.color, fontVariantNumeric: 'tabular-nums' }}>{p.value}</span>
          </div>
        ))}
        <button onClick={() => setShowWhy(true)} style={{ marginTop: 12, fontSize: 12, color: T.teal100, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>View methodology →</button>
      </div>
      {showWhy && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowWhy(false)}><WhyDrawer text="Projections assume current holdings of $180,000 plus ongoing contributions of $1,200/month, compounded monthly over 18 years. Conservative uses 4% annualized return, Expected uses 7%, Optimistic uses 10%. These are educational references only — actual returns vary and are not guaranteed. Assumptions are reviewed quarterly." onClose={() => setShowWhy(false)} /></div>}
    </div>
  );
}

/* ── Alerts Tab ── */
function AlertsTab({ accent }: { accent: string }) {
  const [dismissed, setDismissed] = useState<number[]>([]);
  const [shown, setShown] = useState<number | null>(null);
  const bgMap: Record<string, string> = { celebration: '#F0FDF4', spending: '#FFFBEB', subscription: '#F0F9FF', investing: '#FAF5FF', income: '#F0FDF4' };
  const borderMap: Record<string, string> = { celebration: T.success, spending: T.caution, subscription: '#0369a1', investing: '#7c3aed', income: T.success };
  const visible = ALERTS.filter(a => !dismissed.includes(a.id));

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: T.sand50 }}>
      <div style={{ padding: '16px 20px 12px', position: 'sticky', top: 0, background: T.sand50, zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.navy900 }}>Alerts</div>
          <div style={{ fontSize: 12, color: T.slate500 }}>{visible.filter(a => !a.read).length} new</div>
        </div>
      </div>
      <div style={{ padding: '4px 20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visible.map(a => (
          <div key={a.id} style={{ background: a.read ? T.white : bgMap[a.type] ?? T.white, borderRadius: 18, padding: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', cursor: 'pointer', borderLeft: a.read ? 'none' : `4px solid ${borderMap[a.type] ?? accent}` }} onClick={() => setShown(shown === a.id ? null : a.id)}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{a.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.navy900, lineHeight: 1.3 }}>{a.title}</div>
                  {!a.read && <span style={{ flexShrink: 0, width: 7, height: 7, borderRadius: '50%', background: accent, marginTop: 4 }} />}
                </div>
                <div style={{ fontSize: 12, color: T.slate500, marginTop: 2 }}>{a.time}</div>
                {shown === a.id && (
                  <div style={{ marginTop: 10 }}>
                    <p style={{ fontSize: 13, color: T.slate700, lineHeight: 1.6, marginBottom: 12 }}>{a.body}</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ flex: 1, padding: '9px', borderRadius: 9, background: accent, border: 'none', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>View details</button>
                      <button onClick={e => { e.stopPropagation(); setDismissed([...dismissed, a.id]); }} style={{ padding: '9px 14px', borderRadius: 9, background: T.slate100, border: 'none', color: T.slate500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Dismiss</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: T.slate500 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: T.navy900 }}>You're all caught up</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>No new alerts right now.</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Profile Tab ── */
function ProfileTab({ accent, persona }: { accent: string; persona: string }) {
  const fullName = persona === 'Sarah' ? 'Sarah Chen' : persona === 'Marcus' ? 'Marcus Williams' : 'Jordan Patel';
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: T.sand50 }}>
      <div style={{ padding: '16px 20px 0' }}><div style={{ fontSize: 22, fontWeight: 700, color: T.navy900, marginBottom: 16 }}>Profile</div></div>
      <div style={{ margin: '0 20px', background: T.navy900, borderRadius: 20, padding: '20px', color: T.white, display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>{persona[0]}</div>
        <div><div style={{ fontSize: 18, fontWeight: 700 }}>{fullName}</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Member since May 2026 · Premium</div></div>
      </div>
      {[
        { title: 'Connected Accounts', items: [{ icon: '🏦', label: 'Chase Checking', sub: '••••4823 · Linked 3 days ago', action: 'Manage' }, { icon: '💳', label: 'Amex Platinum', sub: '••••1042 · Linked 3 days ago', action: 'Manage' }, { icon: '📈', label: 'Fidelity Brokerage', sub: '••••7731 · Linked 2 days ago', action: 'Manage' }, { icon: '➕', label: 'Link another account', sub: 'Add bank, brokerage, or loan', action: 'Add', accent: true }] },
        { title: 'Alerts & Notifications', items: [{ icon: '🔔', label: 'Alert frequency', sub: 'Weekly digest', action: 'Change' }, { icon: '🎉', label: 'Celebration alerts', sub: 'On', action: 'Toggle' }, { icon: '⚡', label: 'Spending drift alerts', sub: 'Weekly digest', action: 'Change' }] },
        { title: 'Privacy & Security', items: [{ icon: '🔒', label: 'Data access controls', sub: 'Manage what we see', action: 'Review' }, { icon: '📤', label: 'Export my data', sub: 'Download all your data', action: 'Export' }, { icon: '🗑️', label: 'Delete account', sub: 'Permanent — data removed within 30 days', action: 'Delete', danger: true }] },
      ].map(section => (
        <div key={section.title} style={{ margin: '16px 20px 0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.slate500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{section.title}</div>
          <div style={{ background: T.white, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            {section.items.map((item, idx) => (
              <div key={item.label} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 16px', borderBottom: idx < section.items.length - 1 ? `1px solid ${T.slate100}` : 'none', cursor: 'pointer' }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: (item as any).danger ? T.error : (item as any).accent ? accent : T.navy900 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: T.slate500, marginTop: 1 }}>{item.sub}</div>
                </div>
                <span style={{ fontSize: 12, color: (item as any).danger ? T.error : (item as any).accent ? accent : T.slate500, fontWeight: 600 }}>{item.action}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{ height: 32 }} />
    </div>
  );
}

/* ── Bottom Nav ── */
function BottomNav({ tab, setTab, unread, accent }: { tab: string; setTab: (t: string) => void; unread: number; accent: string }) {
  const tabs = [
    { id: 'goals', icon: (active: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={active ? accent : T.slate500} strokeWidth="2" /><circle cx="12" cy="12" r="5" stroke={active ? accent : T.slate500} strokeWidth="2" /><circle cx="12" cy="12" r="2" fill={active ? accent : T.slate500} /></svg>, label: 'Goals' },
    { id: 'money', icon: (active: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="2" stroke={active ? accent : T.slate500} strokeWidth="2" /><path d="M3 10h18" stroke={active ? accent : T.slate500} strokeWidth="2" /><circle cx="8" cy="14" r="1.5" fill={active ? accent : T.slate500} /></svg>, label: 'Money' },
    { id: 'invest', icon: (active: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><polyline points="3,17 8,11 12,14 16,8 21,12" stroke={active ? accent : T.slate500} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" /><polyline points="17,8 21,8 21,12" stroke={active ? accent : T.slate500} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" /></svg>, label: 'Invest' },
    { id: 'alerts', icon: (active: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={active ? accent : T.slate500} strokeWidth="2" strokeLinejoin="round" /><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={active ? accent : T.slate500} strokeWidth="2" /></svg>, label: 'Alerts' },
    { id: 'profile', icon: (active: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={active ? accent : T.slate500} strokeWidth="2" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={active ? accent : T.slate500} strokeWidth="2" strokeLinecap="round" /></svg>, label: 'Profile' },
  ];
  return (
    <div style={{ background: T.white, borderTop: `1px solid ${T.slate100}`, display: 'flex', paddingBottom: 8 }}>
      {tabs.map(t => {
        const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '10px 0 4px', background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
            {t.icon(active)}
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? accent : T.slate500 }}>{t.label}</span>
            {t.id === 'alerts' && unread > 0 && <span style={{ position: 'absolute', top: 6, right: '50%', transform: 'translateX(12px)', width: 8, height: 8, borderRadius: '50%', background: T.caution }} />}
          </button>
        );
      })}
    </div>
  );
}

/* ── Tweaks Panel ── */
function TweaksPanel({ tweaks, setTweak }: { tweaks: { accentColor: string; persona: string; darkMode: boolean }; setTweak: (k: string, v: string | boolean) => void }) {
  const [open, setOpen] = useState(false);
  const personas = ['Sarah', 'Marcus', 'Jordan'];
  const colors = ['#2C7A7B', '#0369a1', '#7c3aed', '#15803D', '#B45309'];
  return (
    <>
      <button onClick={() => setOpen(!open)} style={{ position: 'fixed', right: 20, top: '50%', transform: 'translateY(-50%)', background: '#1f2937', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', zIndex: 100, letterSpacing: '0.04em' }}>⚙ Tweaks</button>
      {open && (
        <div style={{ position: 'fixed', right: 68, top: '50%', transform: 'translateY(-50%)', background: '#1f2937', borderRadius: 12, padding: '16px', width: 200, zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Tweaks</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Persona</div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {personas.map(p => <button key={p} onClick={() => setTweak('persona', p)} style={{ flex: 1, padding: '5px 4px', borderRadius: 6, border: 'none', background: tweaks.persona === p ? '#3d9e9f' : '#374151', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{p}</button>)}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Accent Color</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {colors.map(c => <button key={c} onClick={() => setTweak('accentColor', c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: tweaks.accentColor === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer' }} />)}
          </div>
        </div>
      )}
    </>
  );
}

/* ── Main App ── */
export default function App() {
  const [tweaks, setTweakState] = useState({ accentColor: '#2C7A7B', persona: 'Sarah', darkMode: false });
  const [tab, setTab] = useState('goals');
  const [onboarding, setOnboarding] = useState(true);
  const [goalDetail, setGoalDetail] = useState<Goal | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [extraGoals, setExtraGoals] = useState<Goal[]>([]);
  const [activeTxn, setActiveTxn] = useState<Txn | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const accent = tweaks.accentColor;

  function setTweak(k: string, v: string | boolean) { setTweakState(prev => ({ ...prev, [k]: v })); }

  const unread = ALERTS.filter(a => !a.read).length;

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111827' }}>
      {/* Phone shell */}
      <div style={{ width: 390, height: 844, borderRadius: 52, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.15)', background: T.sand50, display: 'flex', flexDirection: 'column', position: 'relative' }}>

        {/* Status bar */}
        <div style={{ height: 50, background: T.sand50, display: 'flex', alignItems: 'flex-end', padding: '0 28px 8px', flexShrink: 0, justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.navy900, fontVariantNumeric: 'tabular-nums' }}>9:41</span>
          <div style={{ width: 120, height: 34, borderRadius: 99, background: '#000', position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)' }} />
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <svg width="16" height="12" viewBox="0 0 16 12"><rect x="0" y="4" width="3" height="8" rx="1" fill={T.navy900} /><rect x="4.5" y="2" width="3" height="10" rx="1" fill={T.navy900} /><rect x="9" y="0" width="3" height="12" rx="1" fill={T.navy900} /><rect x="13.5" y="0" width="2.5" height="12" rx="1" fill={T.slate300} /></svg>
            <svg width="26" height="13" viewBox="0 0 26 13"><rect x="0.5" y="0.5" width="22" height="12" rx="3" stroke={T.navy900} strokeWidth="1" /><rect x="2" y="2" width="18" height="9" rx="2" fill={T.navy900} /><path d="M24 4.5v4a2 2 0 0 0 0-4z" fill={T.navy900} /></svg>
          </div>
        </div>

        {/* Screen */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {goalDetail ? (
            <GoalDetail goal={goalDetail} onBack={() => setGoalDetail(null)}
              onDelete={id => { setExtraGoals(prev => prev.filter(g => g.id !== id)); setGoalDetail(null); }}
              onEdit={updated => { setExtraGoals(prev => prev.map(g => g.id === updated.id ? updated : g)); setGoalDetail(updated); }}
              accent={accent} />
          ) : (
            <>
              {tab === 'goals'   && <GoalsTab onGoalTap={setGoalDetail} onAddGoal={() => setShowGoalModal(true)} extraGoals={extraGoals} accent={accent} persona={tweaks.persona} />}
              {tab === 'money'   && <MoneyTab accent={accent} onTxnTap={setActiveTxn} onCategoryTap={setActiveCategory} />}
              {tab === 'invest'  && <InvestTab accent={accent} />}
              {tab === 'alerts'  && <AlertsTab accent={accent} />}
              {tab === 'profile' && <ProfileTab accent={accent} persona={tweaks.persona} />}
            </>
          )}
        </div>

        {onboarding && <OnboardingFlow accent={accent} onComplete={() => setOnboarding(false)} />}

        {!goalDetail && !showChat && !activeTxn && !activeCategory && !showGoalModal && !onboarding && (
          <button onClick={() => setShowChat(true)} style={{ position: 'absolute', bottom: 100, right: 20, width: 48, height: 48, borderRadius: '50%', background: accent, border: 'none', cursor: 'pointer', zIndex: 30, boxShadow: '0 4px 16px rgba(44,122,123,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.15s', fontSize: 20 }}>✨</button>
        )}

        {!goalDetail && <BottomNav tab={tab} setTab={setTab} unread={unread} accent={accent} />}

        <div style={{ height: 34, background: T.sand50, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 120, height: 5, borderRadius: 99, background: 'rgba(0,0,0,0.2)' }} />
        </div>

        {showChat && <div style={{ position: 'absolute', inset: 0, zIndex: 80 }}><AIChatSurface accent={accent} onClose={() => setShowChat(false)} /></div>}
        {activeCategory && <div style={{ position: 'absolute', inset: 0, zIndex: 65 }}><SpendingDrilldown category={activeCategory} accent={accent} onClose={() => setActiveCategory(null)} onTxnTap={t => { setActiveCategory(null); setTimeout(() => setActiveTxn(t), 80); }} /></div>}
        {activeTxn && <div style={{ position: 'absolute', inset: 0, zIndex: 70 }}><TxnDetailModal txn={activeTxn} accent={accent} onClose={() => setActiveTxn(null)} /></div>}
        {showGoalModal && <div style={{ position: 'absolute', inset: 0, zIndex: 60 }}><GoalCreationModal accent={accent} onClose={() => setShowGoalModal(false)} onSave={goal => { setExtraGoals(prev => [...prev, goal]); setShowGoalModal(false); }} /></div>}
      </div>

      <TweaksPanel tweaks={tweaks} setTweak={setTweak} />
    </div>
  );
}
