'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
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
function GoalsTab({ onGoalTap, onAddGoal, onProfileTap, extraGoals, accent, persona }: {
  onGoalTap: (g: Goal) => void; onAddGoal: () => void; onProfileTap: () => void; extraGoals: Goal[]; accent: string; persona: string;
}) {
  const [showWhy, setShowWhy] = useState(false);
  const [showExplore, setShowExplore] = useState(false);
  const [exploreApplied, setExploreApplied] = useState(false);
  const [exploreChoice, setExploreChoice] = useState<'transfer' | 'roundup' | 'pause'>('transfer');
  const [scoreBreakdown, setScoreBreakdown] = useState(false);

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: T.sand50 }}>
      <div style={{ padding: '16px 20px 0', background: T.sand50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 13, color: T.slate500, fontWeight: 500 }}>Good morning,</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.navy900, lineHeight: 1.2 }}>{persona} 👋</div>
          </div>
          <button onClick={onProfileTap} style={{ width: 40, height: 40, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}>{persona[0]}</button>
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
          <button onClick={() => { setExploreApplied(false); setShowExplore(true); }} style={{ flex: 1, padding: '10px', borderRadius: 10, background: accent, border: 'none', color: T.white, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Explore this</button>
          <button onClick={() => setShowWhy(true)} style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: 'none', color: T.white, fontWeight: 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Why?</button>
        </div>
      </div>

      {showWhy && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowWhy(false)}>
          <WhyDrawer text="Your current savings velocity is $400/month into the home goal. Your target is $120,000 by August 2027 — 27 months away. At $400/month, you'd reach $48,200 + ($400 × 27) = $59,000, falling $61,000 short. Increasing to $600/month closes the gap entirely and creates a buffer, moving your expected completion to December 2026 — 8 months ahead." onClose={() => setShowWhy(false)} />
        </div>
      )}

      {showExplore && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,42,74,0.45)', zIndex: 45, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowExplore(false)}>
          <div style={{ background: '#FAF7F2', borderRadius: '24px 24px 0 0', width: '100%', maxHeight: '88%', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', animation: 'confirmSlideUp 0.25s cubic-bezier(.2,.8,.4,1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: T.slate300, margin: '0 auto 14px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.navy900 }}>Explore Next Best Action</div>
                <button onClick={() => setShowExplore(false)} style={{ width: 30, height: 30, borderRadius: '50%', background: T.slate100, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: T.slate500 }}>✕</button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }}>
              {!exploreApplied ? (
                <>
                  <p style={{ fontSize: 13, color: T.slate500, lineHeight: 1.6, marginBottom: 14 }}>Choose how you want to act on this recommendation. You can switch anytime.</p>
                  {[
                    { id: 'transfer', title: 'Increase monthly transfer to $600', sub: 'Auto-adjust your recurring contribution', eta: 'Best impact · +8 months faster' },
                    { id: 'roundup', title: 'Keep $400 + enable smart round-ups', sub: 'Round purchases to accelerate savings', eta: 'Moderate impact · +5 months faster' },
                    { id: 'pause', title: 'Remind me in 30 days', sub: 'No transfer changes right now', eta: 'No timeline improvement' },
                  ].map(option => {
                    const selected = exploreChoice === option.id;
                    return (
                      <div key={option.id} onClick={() => setExploreChoice(option.id as 'transfer' | 'roundup' | 'pause')} style={{ background: T.white, borderRadius: 14, padding: '12px 14px', marginBottom: 8, border: `2px solid ${selected ? accent : T.slate200}`, cursor: 'pointer' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${selected ? accent : T.slate300}`, background: selected ? accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {selected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: T.navy900 }}>{option.title}</div>
                            <div style={{ fontSize: 12, color: T.slate500, marginTop: 1 }}>{option.sub}</div>
                            <div style={{ fontSize: 11, color: selected ? accent : T.slate500, fontWeight: 600, marginTop: 6 }}>{option.eta}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={() => setExploreApplied(true)} style={{ width: '100%', marginTop: 10, padding: '14px', borderRadius: 14, border: 'none', background: accent, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {exploreChoice === 'pause' ? 'Set reminder' : 'Apply this plan'}
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>{exploreChoice === 'pause' ? '⏰' : '✅'}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.navy900, marginBottom: 8 }}>
                    {exploreChoice === 'pause' ? 'Reminder scheduled' : 'Plan applied'}
                  </div>
                  <p style={{ fontSize: 14, color: T.slate500, lineHeight: 1.6, maxWidth: 280, margin: '0 auto 22px' }}>
                    {exploreChoice === 'transfer' && 'Your recurring transfer is now set to $600/month. We will monitor progress and alert you if you drift.'}
                    {exploreChoice === 'roundup' && 'Smart round-ups are now enabled alongside your $400 transfer to help accelerate this goal.'}
                    {exploreChoice === 'pause' && 'We will remind you in 30 days with an updated projection based on your latest spending and savings.'}
                  </p>
                  <button onClick={() => setShowExplore(false)} style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: accent, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Done</button>
                </div>
              )}
            </div>
          </div>
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
  const targetAmountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showEdit) return;
    const timer = setTimeout(() => {
      targetAmountRef.current?.focus();
      targetAmountRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 40);
    return () => clearTimeout(timer);
  }, [showEdit]);

  const goalCurrent = goal.current;
  const goalId = goal.id;
  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const base = goalCurrent * (i / 11);
        const jitter = (goalId * 929 + i * 173) % 2001;
        return Math.round(base + jitter);
      }),
    [goalCurrent, goalId],
  );

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
            <p style={{ fontSize: 14, color: T.slate500, textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}><strong style={{ color: T.navy900 }}>{goal.label}</strong> and all its progress data will be permanently removed. This can&apos;t be undone.</p>
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
                <div style={{ position: 'relative' }} onClick={() => targetAmountRef.current?.focus()}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, fontWeight: 600, color: '#64748B' }}>$</span>
                  <input
                    ref={targetAmountRef}
                    type="text"
                    inputMode="decimal"
                    enterKeyHint="done"
                    autoComplete="off"
                    value={editData.target}
                    onFocus={() => targetAmountRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })}
                    onChange={e => {
                      const next = e.target.value
                        .replace(/[^\d.]/g, '')
                        .replace(/(\..*)\./g, '$1');
                      setEditData(p => ({ ...p, target: next }));
                    }}
                    style={{ width: '100%', padding: '12px 14px 12px 28px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 15, fontWeight: 600, color: '#0F2A4A', fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums', outline: 'none', background: '#fff' }}
                  />
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
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', overflowY: 'hidden', whiteSpace: 'nowrap', paddingBottom: 6, WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ flex: '0 0 auto', padding: '6px 12px', borderRadius: 99, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, background: filter === f ? accent : T.white, color: filter === f ? T.white : T.slate700, boxShadow: filter === f ? 'none' : '0 1px 4px rgba(0,0,0,0.08)', transition: 'all 0.15s' }}>
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
  const [activeHolding, setActiveHolding] = useState<(typeof HOLDINGS)[number] | null>(null);
  const [activeScenario, setActiveScenario] = useState<'Conservative' | 'Expected' | 'Optimistic' | null>(null);
  const [rebalanceDone, setRebalanceDone] = useState(false);
  const totalValue = HOLDINGS.reduce((s, h) => s + h.value, 0);
  const colors = [accent, '#0369a1', '#7c3aed', '#15803D', T.slate300];
  const segments = HOLDINGS.map((h, i) => ({
    ...h,
    start: HOLDINGS.slice(0, i).reduce((sum, x) => sum + x.pct, 0),
    color: colors[i],
  }));

  function polarToXY(angle: number, r = 40) { const rad = (angle - 90) * Math.PI / 180; return { x: 50 + r * Math.cos(rad), y: 50 + r * Math.sin(rad) }; }
  function describeArc(startPct: number, endPct: number) {
    const start = polarToXY(startPct * 3.6), end = polarToXY(endPct * 3.6);
    return `M ${start.x} ${start.y} A 40 40 0 ${endPct - startPct > 50 ? 1 : 0} 1 ${end.x} ${end.y}`;
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: T.sand50, position: 'relative', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ padding: '16px 20px 0' }}><div style={{ fontSize: 22, fontWeight: 700, color: T.navy900, marginBottom: 16 }}>Invest</div></div>
      <div style={{ margin: '0 20px', background: T.white, borderRadius: 20, padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <button onClick={() => setActiveHolding(HOLDINGS[0])} style={{ position: 'relative', width: 110, height: 110, flexShrink: 0, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}>
            <svg viewBox="0 0 100 100" width={110} height={110}>
              {segments.map((s, i) => s.pct === 0 ? null : <path key={i} d={describeArc(s.start, s.start + s.pct)} fill="none" stroke={s.color} strokeWidth="18" strokeLinecap="butt" />)}
              <circle cx="50" cy="50" r="27" fill={T.sand50} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy900, fontVariantNumeric: 'tabular-nums' }}>{fmt(totalValue)}</div>
              <div style={{ fontSize: 10, color: T.slate500 }}>total</div>
            </div>
          </button>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {HOLDINGS.map((h, i) => (
              <button key={h.name} onClick={() => setActiveHolding(h)} style={{ width: '100%', minHeight: 40, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 10, border: '1px solid transparent', background: '#F8FAFC', cursor: 'pointer', fontFamily: 'inherit' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: colors[i], flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: T.slate700 }}>{h.name.split('(')[0].trim()}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.navy900, fontVariantNumeric: 'tabular-nums' }}>{h.pct}%</span>
              </button>
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
            <div key={h.name} onClick={() => setActiveHolding(h)} style={{ background: T.white, borderRadius: 16, padding: '14px 16px', marginBottom: 8, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
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
          <button key={p.label} onClick={() => setActiveScenario(p.label as 'Conservative' | 'Expected' | 'Optimistic')} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', borderTop: 'none', borderLeft: 'none', borderRight: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{p.label}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: p.color, fontVariantNumeric: 'tabular-nums' }}>{p.value}</span>
          </button>
        ))}
        <button onClick={() => { setRebalanceDone(true); setTimeout(() => setRebalanceDone(false), 1200); }} style={{ width: '100%', marginTop: 12, padding: '10px', borderRadius: 10, border: 'none', background: accent, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{rebalanceDone ? 'Rebalance plan saved ✓' : 'Create rebalance plan'}</button>
        <button onClick={() => setShowWhy(true)} style={{ marginTop: 12, fontSize: 12, color: T.teal100, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>View methodology →</button>
      </div>
      </div>
      {showWhy && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowWhy(false)}><WhyDrawer text="Projections assume current holdings of $180,000 plus ongoing contributions of $1,200/month, compounded monthly over 18 years. Conservative uses 4% annualized return, Expected uses 7%, Optimistic uses 10%. These are educational references only — actual returns vary and are not guaranteed. Assumptions are reviewed quarterly." onClose={() => setShowWhy(false)} /></div>}

      {activeHolding && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,42,74,0.45)', zIndex: 45, display: 'flex', alignItems: 'flex-end' }} onClick={() => setActiveHolding(null)}>
          <div style={{ background: '#FAF7F2', borderRadius: '24px 24px 0 0', width: '100%', maxHeight: '84%', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: T.slate300, margin: '0 auto 14px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.navy900 }}>{activeHolding.name}</div>
                <button onClick={() => setActiveHolding(null)} style={{ width: 30, height: 30, borderRadius: '50%', background: T.slate100, border: 'none', cursor: 'pointer', fontSize: 16, color: T.slate500 }}>✕</button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }}>
              <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: T.slate500, marginBottom: 6 }}>Current value</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.navy900 }}>{fmt(activeHolding.value)}</div>
                <div style={{ fontSize: 12, color: T.slate500, marginTop: 2 }}>{activeHolding.pct}% actual vs {activeHolding.ref}% reference</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.slate500, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Actions</div>
                {['View lot/performance detail', 'Adjust contribution destination', 'Set drift alert for this holding'].map(a => (
                  <div key={a} style={{ fontSize: 13, color: T.slate700, padding: '7px 0', borderBottom: `1px solid ${T.slate100}` }}>{a}</div>
                ))}
              </div>
              <button onClick={() => setActiveHolding(null)} style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: accent, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {activeScenario && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,42,74,0.45)', zIndex: 46, display: 'flex', alignItems: 'flex-end' }} onClick={() => setActiveScenario(null)}>
          <div style={{ background: '#FAF7F2', borderRadius: '24px 24px 0 0', width: '100%', maxHeight: '72%', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '12px 20px 20px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: T.slate300, margin: '0 auto 14px' }} />
              <div style={{ fontSize: 18, fontWeight: 700, color: T.navy900, marginBottom: 8 }}>{activeScenario} scenario</div>
              <p style={{ fontSize: 13, color: T.slate700, lineHeight: 1.6 }}>
                {activeScenario === 'Conservative' && 'Uses a lower-return assumption to stress test downside conditions and sequence risk near retirement.'}
                {activeScenario === 'Expected' && 'Uses the baseline return assumption aligned to your current allocation and long-run capital market ranges.'}
                {activeScenario === 'Optimistic' && 'Uses an upper-bound return assumption for upside context; outcomes may vary significantly year to year.'}
              </p>
              <button onClick={() => setActiveScenario(null)} style={{ width: '100%', marginTop: 14, padding: '12px', borderRadius: 12, border: 'none', background: accent, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Alerts Tab ── */
function AlertsTab({ accent }: { accent: string }) {
  const [dismissed, setDismissed] = useState<number[]>([]);
  const [shown, setShown] = useState<number | null>(null);
  const [activeAlert, setActiveAlert] = useState<(typeof ALERTS)[number] | null>(null);
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
                      <button onClick={e => { e.stopPropagation(); setActiveAlert(a); }} style={{ flex: 1, padding: '9px', borderRadius: 9, background: accent, border: 'none', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>View details</button>
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
            <div style={{ fontSize: 16, fontWeight: 600, color: T.navy900 }}>You&apos;re all caught up</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>No new alerts right now.</div>
          </div>
        )}
      </div>

      {activeAlert && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,42,74,0.45)', zIndex: 55, display: 'flex', alignItems: 'flex-end' }} onClick={() => setActiveAlert(null)}>
          <div style={{ background: '#FAF7F2', borderRadius: '24px 24px 0 0', width: '100%', maxHeight: '86%', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', animation: 'confirmSlideUp 0.25s cubic-bezier(.2,.8,.4,1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: T.slate300, margin: '0 auto 14px' }} />
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 26 }}>{activeAlert.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.navy900 }}>{activeAlert.title}</div>
                  <div style={{ fontSize: 12, color: T.slate500, marginTop: 2 }}>{activeAlert.time}</div>
                </div>
                <button onClick={() => setActiveAlert(null)} style={{ width: 30, height: 30, borderRadius: '50%', background: T.slate100, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: T.slate500 }}>✕</button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
              <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.slate500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>What happened</div>
                <p style={{ fontSize: 14, color: T.slate700, lineHeight: 1.65 }}>{activeAlert.body}</p>
              </div>

              <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.slate500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Suggested actions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    'Review impacted goal timeline',
                    'Adjust next month budget targets',
                    'Enable tighter alerts for this category',
                  ].map(item => (
                    <div key={item} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: T.slate700 }}>
                      <span style={{ color: accent, fontWeight: 700 }}>•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: '0 20px 28px', flexShrink: 0, display: 'flex', gap: 8 }}>
              <button onClick={() => { setDismissed(prev => [...prev, activeAlert.id]); setActiveAlert(null); }} style={{ flex: 1, padding: '12px', borderRadius: 12, border: `1.5px solid ${T.slate300}`, background: '#fff', color: T.slate700, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Dismiss alert</button>
              <button onClick={() => setActiveAlert(null)} style={{ flex: 1.3, padding: '12px', borderRadius: 12, border: 'none', background: accent, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Profile Tab ── */
function ProfileSheet({ title, onClose, children, maxHeight = '88%' }: { title: string; onClose: () => void; children: React.ReactNode; maxHeight?: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,42,74,0.45)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#FAF7F2', borderRadius: '24px 24px 0 0', width: '100%', maxHeight, display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', animation: 'confirmSlideUp 0.25s cubic-bezier(.2,.8,.4,1)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: T.slate300, margin: '0 auto 14px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.navy900 }}>{title}</div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: T.slate100, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: T.slate500 }}>✕</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }}>{children}</div>
      </div>
    </div>
  );
}

function ProfileTab({ accent, persona }: { accent: string; persona: string }) {
  const fullName = persona === 'Sarah' ? 'Sarah Chen' : persona === 'Marcus' ? 'Marcus Williams' : 'Jordan Patel';

  type Sheet = 'manage' | 'link' | 'alerts' | 'dataAccess' | 'export' | 'deleteAccount' | null;
  const [sheet, setSheet] = useState<Sheet>(null);
  const [manageAcct, setManageAcct] = useState<{ icon: string; label: string; sub: string } | null>(null);
  const [disconnectConfirm, setDisconnectConfirm] = useState(false);
  const [accounts, setAccounts] = useState([
    { id: 'chase',    icon: '🏦', label: 'Chase Checking',    sub: '••••4823 · Linked 3 days ago' },
    { id: 'amex',     icon: '💳', label: 'Amex Platinum',     sub: '••••1042 · Linked 3 days ago' },
    { id: 'fidelity', icon: '📈', label: 'Fidelity Brokerage', sub: '••••7731 · Linked 2 days ago' },
  ]);
  const [linkSearch, setLinkSearch] = useState('');
  const [linking, setLinking] = useState<string | null>(null);
  const [alertFreq, setAlertFreq] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [driftFreq, setDriftFreq] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [celebOn, setCelebOn] = useState(true);
  const [dataToggles, setDataToggles] = useState({ transactions: true, balances: true, investments: true, goals: true, identity: false });
  const [exportFmt, setExportFmt] = useState<'CSV' | 'PDF'>('CSV');
  const [exportDone, setExportDone] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  const ALL_LINK_ACCOUNTS = [
    { id: 'bofa', icon: '🏦', label: 'Bank of America', sub: 'Checking & savings' },
    { id: 'wellsfargo', icon: '🐎', label: 'Wells Fargo', sub: 'Checking & mortgage' },
    { id: 'schwab', icon: '🏛️', label: 'Schwab', sub: 'Brokerage & 401(k)' },
    { id: 'vanguard', icon: '📊', label: 'Vanguard', sub: 'Index funds & IRA' },
    { id: 'citi', icon: '🌐', label: 'Citi', sub: 'Credit cards & banking' },
    { id: 'capitalone', icon: '🔺', label: 'Capital One', sub: 'Checking & credit cards' },
    { id: 'robinhood', icon: '🪶', label: 'Robinhood', sub: 'Stocks & crypto' },
    { id: 'sofi', icon: '💜', label: 'SoFi', sub: 'Banking & investing' },
    { id: 'ally', icon: '🚗', label: 'Ally', sub: 'Online savings & auto' },
    { id: 'etrade', icon: '📉', label: 'E*TRADE', sub: 'Brokerage & options' },
  ].filter(a => !accounts.find(ac => ac.id === a.id));

  function linkAccount(a: { id: string; icon: string; label: string; sub: string }) {
    setLinking(a.id);
    setTimeout(() => {
      setAccounts(prev => [...prev, { ...a, sub: `New · Just linked` }]);
      setLinking(null);
    }, 1200);
  }

  const linkResults = linkSearch.trim()
    ? ALL_LINK_ACCOUNTS.filter(a => a.label.toLowerCase().includes(linkSearch.toLowerCase()) || a.sub.toLowerCase().includes(linkSearch.toLowerCase()))
    : ALL_LINK_ACCOUNTS.slice(0, 5);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: T.sand50, position: 'relative', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ padding: '16px 20px 0' }}><div style={{ fontSize: 22, fontWeight: 700, color: T.navy900, marginBottom: 16 }}>Profile</div></div>
      <div style={{ margin: '0 20px', background: T.navy900, borderRadius: 20, padding: '20px', color: T.white, display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>{persona[0]}</div>
        <div><div style={{ fontSize: 18, fontWeight: 700 }}>{fullName}</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Member since May 2026 · Premium</div></div>
      </div>

      {/* Connected Accounts */}
      <div style={{ margin: '16px 20px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.slate500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Connected Accounts</div>
        <div style={{ background: T.white, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
          {accounts.map(a => (
            <div key={a.id} onClick={() => { setManageAcct(a); setDisconnectConfirm(false); setSheet('manage'); }} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 16px', borderBottom: `1px solid ${T.slate100}`, cursor: 'pointer' }}>
              <span style={{ fontSize: 20 }}>{a.icon}</span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: T.navy900 }}>{a.label}</div><div style={{ fontSize: 12, color: T.slate500, marginTop: 1 }}>{a.sub}</div></div>
              <span style={{ fontSize: 12, color: T.slate500, fontWeight: 600 }}>Manage</span>
            </div>
          ))}
          <div onClick={() => { setLinkSearch(''); setSheet('link'); }} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 16px', cursor: 'pointer' }}>
            <span style={{ fontSize: 20 }}>➕</span>
            <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: accent }}>Link another account</div><div style={{ fontSize: 12, color: T.slate500, marginTop: 1 }}>Add bank, brokerage, or loan</div></div>
            <span style={{ fontSize: 12, color: accent, fontWeight: 600 }}>Add</span>
          </div>
        </div>
      </div>

      {/* Alerts & Notifications */}
      <div style={{ margin: '16px 20px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.slate500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Alerts & Notifications</div>
        <div style={{ background: T.white, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
          {[
            { icon: '🔔', label: 'Alert frequency', sub: alertFreq + ' digest', action: 'Change', onClick: () => setSheet('alerts') },
            { icon: '🎉', label: 'Celebration alerts', sub: celebOn ? 'On' : 'Off', action: 'Toggle', onClick: () => setCelebOn(v => !v) },
            { icon: '⚡', label: 'Spending drift alerts', sub: driftFreq + ' digest', action: 'Change', onClick: () => setSheet('alerts') },
          ].map((item, idx, arr) => (
            <div key={item.label} onClick={item.onClick} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 16px', borderBottom: idx < arr.length - 1 ? `1px solid ${T.slate100}` : 'none', cursor: 'pointer' }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: T.navy900 }}>{item.label}</div><div style={{ fontSize: 12, color: T.slate500, marginTop: 1 }}>{item.sub}</div></div>
              {item.label === 'Celebration alerts' ? (
                <div style={{ width: 40, height: 24, borderRadius: 99, background: celebOn ? accent : T.slate300, position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: celebOn ? 18 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.18)' }} />
                </div>
              ) : (
                <span style={{ fontSize: 12, color: T.slate500, fontWeight: 600 }}>{item.action}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Privacy & Security */}
      <div style={{ margin: '16px 20px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.slate500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Privacy & Security</div>
        <div style={{ background: T.white, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
          {[
            { icon: '🔒', label: 'Data access controls', sub: 'Manage what we see', action: 'Review', onClick: () => setSheet('dataAccess') },
            { icon: '📤', label: 'Export my data', sub: 'Download all your data', action: 'Export', onClick: () => { setExportDone(false); setSheet('export'); } },
            { icon: '🗑️', label: 'Delete account', sub: 'Permanent — data removed within 30 days', action: 'Delete', danger: true, onClick: () => { setDeleteInput(''); setDeleteConfirmed(false); setSheet('deleteAccount'); } },
          ].map((item, idx, arr) => (
            <div key={item.label} onClick={item.onClick} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 16px', borderBottom: idx < arr.length - 1 ? `1px solid ${T.slate100}` : 'none', cursor: 'pointer' }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: item.danger ? T.error : T.navy900 }}>{item.label}</div><div style={{ fontSize: 12, color: T.slate500, marginTop: 1 }}>{item.sub}</div></div>
              <span style={{ fontSize: 12, color: item.danger ? T.error : T.slate500, fontWeight: 600 }}>{item.action}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 32 }} />
      </div>{/* end scrollable inner */}

      {/* ── Manage Account Sheet ── */}
      {sheet === 'manage' && manageAcct && (
        <ProfileSheet title="Manage Account" onClose={() => setSheet(null)}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', background: T.white, borderRadius: 16, padding: '16px', marginBottom: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: 32 }}>{manageAcct.icon}</span>
            <div><div style={{ fontSize: 16, fontWeight: 700, color: T.navy900 }}>{manageAcct.label}</div><div style={{ fontSize: 13, color: T.slate500, marginTop: 2 }}>{manageAcct.sub}</div></div>
          </div>
          <div style={{ background: T.white, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', marginBottom: 16 }}>
            {[
              { label: 'Last synced', value: 'Just now' },
              { label: 'Access level', value: 'Read-only' },
              { label: 'Encryption', value: '256-bit AES' },
              { label: 'Compliance', value: 'CFPB §1033' },
            ].map((row, i, arr) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${T.slate100}` : 'none' }}>
                <span style={{ fontSize: 13, color: T.slate500 }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.navy900 }}>{row.value}</span>
              </div>
            ))}
          </div>
          {!disconnectConfirm ? (
            <button onClick={() => setDisconnectConfirm(true)} style={{ width: '100%', padding: '14px', borderRadius: 14, border: `1.5px solid ${T.error}`, background: 'transparent', color: T.error, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Disconnect account</button>
          ) : (
            <div style={{ background: '#FEF2F2', borderRadius: 14, padding: '16px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.error, marginBottom: 6 }}>Disconnect {manageAcct.label}?</div>
              <p style={{ fontSize: 13, color: '#7F1D1D', lineHeight: 1.55, marginBottom: 14 }}>This removes the connection. Your historical data is preserved but won&apos;t update until you reconnect.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setDisconnectConfirm(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: `1.5px solid ${T.slate300}`, background: 'transparent', color: T.slate700, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button onClick={() => { setAccounts(prev => prev.filter(a => a.id !== (accounts.find(a => a.label === manageAcct.label)?.id))); setSheet(null); }} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: T.error, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Disconnect</button>
              </div>
            </div>
          )}
        </ProfileSheet>
      )}

      {/* ── Link Account Sheet ── */}
      {sheet === 'link' && (
        <ProfileSheet title="Link an Account" onClose={() => setSheet(null)}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 14, background: '#F0FDF4', borderRadius: 10, padding: '8px 12px' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1a6 6 0 1 1 0 12A6 6 0 0 1 7 1zm0 4v3l2 1" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" /></svg>
            <span style={{ fontSize: 11, color: '#15803D', fontWeight: 600 }}>256-bit encryption · Read-only · CFPB §1033</span>
          </div>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input value={linkSearch} onChange={e => setLinkSearch(e.target.value)} placeholder="Search banks, brokerages…" style={{ width: '100%', padding: '11px 14px 11px 34px', borderRadius: 12, border: `1.5px solid ${T.slate200}`, fontSize: 13, color: T.navy900, fontFamily: 'inherit', outline: 'none', background: '#fff' }} />
            {linkSearch && <button onClick={() => setLinkSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: T.slate100, border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', fontSize: 11, color: T.slate500 }}>✕</button>}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.slate500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{linkSearch ? 'Results' : 'Popular institutions'}</div>
          {linkResults.length === 0 && <div style={{ textAlign: 'center', padding: '20px 0', color: T.slate500 }}><div style={{ fontSize: 22, marginBottom: 6 }}>🔍</div><div style={{ fontSize: 13 }}>No matches found</div></div>}
          {linkResults.map(a => (
            <div key={a.id} onClick={() => linkAccount(a)} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', borderRadius: 14, border: `1.5px solid ${T.slate200}`, background: '#fff', marginBottom: 8, cursor: 'pointer' }}>
              <span style={{ fontSize: 22 }}>{a.icon}</span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: T.navy900 }}>{a.label}</div><div style={{ fontSize: 12, color: T.slate500, marginTop: 1 }}>{a.sub}</div></div>
              {linking === a.id
                ? <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${accent}`, borderTopColor: 'transparent', animation: 'obSpin 0.7s linear infinite', flexShrink: 0 }} />
                : <div style={{ fontSize: 12, fontWeight: 700, color: accent, padding: '5px 10px', borderRadius: 8, background: accent + '12', border: `1px solid ${accent}30` }}>Connect</div>}
            </div>
          ))}
        </ProfileSheet>
      )}

      {/* ── Alerts & Notifications Sheet ── */}
      {sheet === 'alerts' && (
        <ProfileSheet title="Alerts & Notifications" onClose={() => setSheet(null)} maxHeight="94%">
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy900, marginBottom: 10 }}>Alert frequency</div>
          <div style={{ background: T.white, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', marginBottom: 20 }}>
            {(['Daily', 'Weekly', 'Monthly'] as const).map((f, i, arr) => (
              <div key={f} onClick={() => setAlertFreq(f)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${T.slate100}` : 'none', cursor: 'pointer' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${alertFreq === f ? accent : T.slate300}`, background: alertFreq === f ? accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                  {alertFreq === f && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <span style={{ fontSize: 14, fontWeight: alertFreq === f ? 600 : 400, color: alertFreq === f ? T.navy900 : T.slate700 }}>{f} digest</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy900, marginBottom: 10 }}>Spending drift alerts</div>
          <div style={{ background: T.white, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', marginBottom: 20 }}>
            {(['Daily', 'Weekly', 'Monthly'] as const).map((f, i, arr) => (
              <div key={f} onClick={() => setDriftFreq(f)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${T.slate100}` : 'none', cursor: 'pointer' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${driftFreq === f ? accent : T.slate300}`, background: driftFreq === f ? accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                  {driftFreq === f && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <span style={{ fontSize: 14, fontWeight: driftFreq === f ? 600 : 400, color: driftFreq === f ? T.navy900 : T.slate700 }}>{f} digest</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy900, marginBottom: 10 }}>Celebration alerts</div>
          <div onClick={() => setCelebOn(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.white, borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', cursor: 'pointer', marginBottom: 20 }}>
            <div><div style={{ fontSize: 14, fontWeight: 600, color: T.navy900 }}>Milestone celebrations</div><div style={{ fontSize: 12, color: T.slate500, marginTop: 2 }}>Confetti + nudge when you hit a goal milestone</div></div>
            <div style={{ width: 44, height: 26, borderRadius: 99, background: celebOn ? accent : T.slate300, position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 3, left: celebOn ? 20 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.18)' }} />
            </div>
          </div>
          <button onClick={() => setSheet(null)} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: accent, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Save preferences</button>
        </ProfileSheet>
      )}

      {/* ── Data Access Controls Sheet ── */}
      {sheet === 'dataAccess' && (
        <ProfileSheet title="Data Access Controls" onClose={() => setSheet(null)}>
          <p style={{ fontSize: 13, color: T.slate500, lineHeight: 1.6, marginBottom: 16 }}>Choose what data we&apos;re allowed to read from your connected accounts. Disabling a category stops new data from being fetched.</p>
          <div style={{ background: T.white, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', marginBottom: 20 }}>
            {(Object.entries(dataToggles) as [keyof typeof dataToggles, boolean][]).map(([key, val], i, arr) => {
              const labels: Record<string, { label: string; sub: string }> = {
                transactions: { label: 'Transactions', sub: 'Purchase history and amounts' },
                balances: { label: 'Account balances', sub: 'Current and historical balances' },
                investments: { label: 'Investments', sub: 'Holdings, positions, returns' },
                goals: { label: 'Goal progress', sub: 'Contribution tracking' },
                identity: { label: 'Identity verification', sub: 'Name and address for compliance' },
              };
              return (
                <div key={key} onClick={() => setDataToggles(prev => ({ ...prev, [key]: !val }))} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${T.slate100}` : 'none', cursor: 'pointer' }}>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: T.navy900 }}>{labels[key].label}</div><div style={{ fontSize: 12, color: T.slate500, marginTop: 1 }}>{labels[key].sub}</div></div>
                  <div style={{ width: 44, height: 26, borderRadius: 99, background: val ? accent : T.slate300, position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 3, left: val ? 20 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.18)' }} />
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => setSheet(null)} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: accent, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Save settings</button>
        </ProfileSheet>
      )}

      {/* ── Export Data Sheet ── */}
      {sheet === 'export' && (
        <ProfileSheet title="Export My Data" onClose={() => setSheet(null)}>
          {!exportDone ? (
            <>
              <p style={{ fontSize: 13, color: T.slate500, lineHeight: 1.6, marginBottom: 16 }}>Download a full copy of your data including transactions, goal history, account balances, and profile settings.</p>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy900, marginBottom: 10 }}>Format</div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                {(['CSV', 'PDF'] as const).map(f => (
                  <button key={f} onClick={() => setExportFmt(f)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: `2px solid ${exportFmt === f ? accent : '#E2E8F0'}`, background: exportFmt === f ? accent + '10' : '#fff', color: exportFmt === f ? accent : T.slate700, fontSize: 14, fontWeight: exportFmt === f ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>{f}</button>
                ))}
              </div>
              <div style={{ background: T.white, borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', marginBottom: 20 }}>
                {['Transactions (all time)', 'Account balances', 'Goal history', 'Alignment score log', 'Profile & settings'].map((item, i, arr) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < arr.length - 1 ? `1px solid ${T.slate100}` : 'none' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14"><polyline points="2,7 5.5,10.5 12,4" stroke={accent} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span style={{ fontSize: 13, color: T.slate700 }}>{item}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setExportDone(true)} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: accent, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Request {exportFmt} export</button>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>📬</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.navy900, marginBottom: 8 }}>Export requested</div>
              <p style={{ fontSize: 14, color: T.slate500, lineHeight: 1.6, maxWidth: 260, margin: '0 auto 24px' }}>We&apos;ll email your {exportFmt} file within 24 hours. You&apos;ll receive a secure download link.</p>
              <button onClick={() => setSheet(null)} style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: accent, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Done</button>
            </div>
          )}
        </ProfileSheet>
      )}

      {/* ── Delete Account Sheet ── */}
      {sheet === 'deleteAccount' && (
        <ProfileSheet title="Delete Account" onClose={() => setSheet(null)}>
          {!deleteConfirmed ? (
            <>
              <div style={{ background: '#FEF2F2', borderRadius: 14, padding: '14px', marginBottom: 16, display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 20 }}>⚠️</span>
                <p style={{ fontSize: 13, color: '#7F1D1D', lineHeight: 1.6 }}>This is permanent. All your data — transactions, goals, alignment history, and account connections — will be deleted within 30 days and cannot be recovered.</p>
              </div>
              <div style={{ background: T.white, borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', marginBottom: 20 }}>
                {['All transaction history', 'Goal progress & targets', 'Alignment score history', 'Connected account links', 'Profile & preferences'].map((item, i, arr) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < arr.length - 1 ? `1px solid ${T.slate100}` : 'none' }}>
                    <span style={{ fontSize: 14, color: T.error }}>✕</span>
                    <span style={{ fontSize: 13, color: T.slate700 }}>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.navy900, marginBottom: 8 }}>Type <strong>DELETE</strong> to confirm</div>
                <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)} placeholder="DELETE" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${deleteInput === 'DELETE' ? T.error : T.slate200}`, fontSize: 14, color: T.navy900, fontFamily: 'inherit', outline: 'none', background: '#fff', letterSpacing: '0.05em' }} />
              </div>
              <button disabled={deleteInput !== 'DELETE'} onClick={() => setDeleteConfirmed(true)} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: deleteInput === 'DELETE' ? T.error : T.slate200, color: deleteInput === 'DELETE' ? '#fff' : T.slate500, fontSize: 15, fontWeight: 700, cursor: deleteInput === 'DELETE' ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all 0.2s' }}>Delete my account</button>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🗑️</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.navy900, marginBottom: 8 }}>Deletion scheduled</div>
              <p style={{ fontSize: 14, color: T.slate500, lineHeight: 1.6, maxWidth: 260, margin: '0 auto' }}>Your account and all associated data will be permanently deleted within 30 days. You&apos;ll receive a confirmation email shortly.</p>
            </div>
          )}
        </ProfileSheet>
      )}
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
              {tab === 'goals'   && <GoalsTab onGoalTap={setGoalDetail} onAddGoal={() => setShowGoalModal(true)} onProfileTap={() => setTab('profile')} extraGoals={extraGoals} accent={accent} persona={tweaks.persona} />}
              {tab === 'money'   && <MoneyTab accent={accent} onTxnTap={setActiveTxn} onCategoryTap={setActiveCategory} />}
              {tab === 'invest'  && <InvestTab accent={accent} />}
              {tab === 'alerts'  && <AlertsTab accent={accent} />}
              {tab === 'profile' && <ProfileTab accent={accent} persona={tweaks.persona} />}
            </>
          )}
        </div>

        {onboarding && <OnboardingFlow accent={accent} onComplete={() => setOnboarding(false)} />}

        {!goalDetail && !showChat && !activeTxn && !activeCategory && !showGoalModal && !onboarding && (
          <button onClick={() => setShowChat(true)} style={{ position: 'absolute', bottom: 100, right: 20, width: 48, height: 48, borderRadius: '50%', background: accent, border: 'none', cursor: 'pointer', zIndex: 30, boxShadow: '0 4px 16px rgba(44,122,123,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.15s' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2l1.8 4.8L18.6 9 13.8 10.8 12 15.6 10.2 10.8 5.4 9l4.8-2.2L12 2z" fill="#fff" />
              <path d="M19 14l1 2.7L22.7 18 20 19l-1 2.7-1-2.7L15.3 18l2.7-1.3L19 14z" fill="#fff" />
            </svg>
          </button>
        )}

        {!goalDetail && <BottomNav tab={tab} setTab={setTab} unread={unread} accent={accent} />}

        <div style={{ height: 34, background: T.sand50, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 120, height: 5, borderRadius: 99, background: 'rgba(0,0,0,0.2)' }} />
        </div>

        {showChat && <div style={{ position: 'absolute', inset: 0, zIndex: 80 }}><AIChatSurface accent={accent} onClose={() => setShowChat(false)} /></div>}
        {activeCategory && <div style={{ position: 'absolute', inset: 0, zIndex: 65 }}><SpendingDrilldown category={activeCategory} onClose={() => setActiveCategory(null)} onTxnTap={t => { setActiveCategory(null); setTimeout(() => setActiveTxn(t), 80); }} /></div>}
        {activeTxn && <div style={{ position: 'absolute', inset: 0, zIndex: 70 }}><TxnDetailModal txn={activeTxn} accent={accent} onClose={() => setActiveTxn(null)} /></div>}
        {showGoalModal && <div style={{ position: 'absolute', inset: 0, zIndex: 60 }}><GoalCreationModal accent={accent} onClose={() => setShowGoalModal(false)} onSave={goal => { setExtraGoals(prev => [...prev, goal]); setShowGoalModal(false); }} /></div>}
      </div>

      <TweaksPanel tweaks={tweaks} setTweak={setTweak} />
    </div>
  );
}
