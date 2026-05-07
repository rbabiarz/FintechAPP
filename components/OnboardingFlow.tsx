'use client';
import { useState, useEffect, useRef } from 'react';
import { OB_GOALS, RISK_QUESTIONS } from '../lib/data';

function riskLabel(score: number) {
  if (score <= 5)  return { label: 'Conservative',       color: '#0369a1', sub: 'Capital preservation focus' };
  if (score <= 8)  return { label: 'Moderate',           color: '#2C7A7B', sub: 'Balanced growth and stability' };
  if (score <= 11) return { label: 'Moderate-Aggressive', color: '#7c3aed', sub: 'Growth-oriented portfolio' };
  return               { label: 'Aggressive',            color: '#B45309', sub: 'Maximum long-term growth' };
}

export default function OnboardingFlow({ onComplete, accent }: { onComplete: () => void; accent: string }) {
  const [screen, setScreen] = useState(0);
  const [direction, setDirection] = useState(1);
  const [animating, setAnimating] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authDone, setAuthDone] = useState(false);
  const [selGoal, setSelGoal] = useState<typeof OB_GOALS[0] | null>(null);
  const [goalAmt, setGoalAmt] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const [linked, setLinked] = useState<string[]>([]);
  const [linking, setLinking] = useState<string | null>(null);
  const [acctSearch, setAcctSearch] = useState('');
  const [riskIdx, setRiskIdx] = useState(0);
  const [riskAns, setRiskAns] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [countUp, setCountUp] = useState(0);
  const goalAmountRef = useRef<HTMLInputElement>(null);
  const TOTAL = 8;

  function goTo(next: number, dir = 1) {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => { setScreen(next); setAnimating(false); }, 200);
  }
  function next() { goTo(screen + 1, 1); }
  function back() { if (screen > 0) goTo(screen - 1, -1); }

  const riskScore = riskAns.reduce((s, a) => s + a, 0);
  const risk = riskLabel(riskScore);

  function linkAccount(id: string) {
    setLinking(id);
    setTimeout(() => { setLinked(prev => [...prev, id]); setLinking(null); }, 1200);
  }

  useEffect(() => {
    if (screen !== 7) return;
    let cancelled = false;
    let countInterval: ReturnType<typeof setInterval> | undefined;

    const resetT = setTimeout(() => {
      if (cancelled) return;
      setRevealed(false);
      setCountUp(0);
    }, 0);

    const t1 = setTimeout(() => {
      if (cancelled) return;
      setRevealed(true);
    }, 600);

    const t2 = setTimeout(() => {
      if (cancelled) return;
      let v = 0;
      const target = 248600;
      const step = Math.ceil(target / 40);
      countInterval = setInterval(() => {
        v = Math.min(v + step, target);
        setCountUp(v);
        if (v >= target && countInterval) clearInterval(countInterval);
      }, 30);
    }, 900);

    return () => {
      cancelled = true;
      clearTimeout(resetT);
      clearTimeout(t1);
      clearTimeout(t2);
      if (countInterval) clearInterval(countInterval);
    };
  }, [screen]);

  const canNext = [true, true, true, authDone || email.length > 4, selGoal !== null, linked.length >= 1, riskAns.length === 3 || riskIdx >= 3, true][screen] ?? false;
  const animIn = direction > 0 ? 'obSlideInR' : 'obSlideInL';
  const animOut = direction > 0 ? 'obSlideOutL' : 'obSlideOutR';
  const isLastScreen = screen === TOTAL - 1;

  function renderScreen() {
    if (screen === 0) return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 28px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, marginBottom: 28, boxShadow: '0 8px 32px ' + accent + '50' }}>🎯</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0F2A4A', lineHeight: 1.2, marginBottom: 16 }}>Money that means something</div>
          <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.7, maxWidth: 280 }}>See exactly how every dollar connects to the life you&apos;re building — not just the accounts you happen to hold.</p>
        </div>
        <div style={{ paddingBottom: 8 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            {[{ icon: '🏠', text: 'Goal-anchored' }, { icon: '🤖', text: 'Transparent AI' }, { icon: '💚', text: 'No judgment' }].map(f => (
              <div key={f.text} style={{ flex: 1, background: '#fff', borderRadius: 14, padding: '12px 8px', textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{f.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>{f.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    if (screen === 1) return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 28px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Show the math</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F2A4A', lineHeight: 1.25, marginBottom: 20 }}>Every transaction, connected to your goals</div>
          {[
            { merchant: 'Erewhon', amount: '$88', cat: 'Dining', shift: '↓ 6 weeks on home goal', warn: true },
            { merchant: 'Paycheck', amount: '+$4,200', cat: 'Income', shift: '↑ 2 weeks ahead', warn: false },
            { merchant: 'Equinox', amount: '$180', cat: 'Health', shift: '✓ Aligned with your values', warn: false },
          ].map((t, i) => (
            <div key={t.merchant} style={{ background: '#fff', borderRadius: 14, padding: '12px 14px', marginBottom: 8, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', animation: `obFadeUp 0.35s ease ${i * 80}ms both` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ fontSize: 14, fontWeight: 700, color: '#0F2A4A' }}>{t.merchant}</div><div style={{ fontSize: 12, color: '#64748B' }}>{t.cat}</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: 14, fontWeight: 700, color: t.amount.startsWith('+') ? '#15803D' : '#0F2A4A' }}>{t.amount}</div><div style={{ fontSize: 11, fontWeight: 600, color: t.warn ? '#B45309' : '#15803D' }}>{t.shift}</div></div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: '14px 16px', background: '#0F2A4A', borderRadius: 16, color: '#fff' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#B2DFDB', marginBottom: 6 }}>Goal Alignment Score</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 40, fontWeight: 800, color: accent }}>74</span>
              <span style={{ fontSize: 14, color: '#6EE7B7' }}>↑ +3 this month</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>One number that tells you if you&apos;re on track.</div>
          </div>
        </div>
      </div>
    );

    if (screen === 2) return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 28px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>No shame, ever</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F2A4A', lineHeight: 1.25, marginBottom: 20 }}>Guidance that treats you like an adult</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '❌', label: 'Other apps say:', text: '"You overspent by $140 this month."', bad: true },
              { icon: '✅', label: 'We say:', text: '"Dining is trending high. At this pace, your home goal shifts ~6 weeks. Here\'s the math — and an easy way to recover it."', bad: false },
            ].map(c => (
              <div key={c.label} style={{ background: c.bad ? '#FEF2F2' : '#F0FDF4', borderRadius: 16, padding: '16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.bad ? '#B91C1C' : '#15803D', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{c.icon} {c.label}</div>
                <p style={{ fontSize: 14, color: c.bad ? '#7F1D1D' : '#14532D', lineHeight: 1.6, fontStyle: c.bad ? 'italic' : 'normal' }}>{c.text}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginTop: 18, textAlign: 'center' }}>Every nudge explains its reasoning. You&apos;re always in control.</p>
        </div>
      </div>
    );

    if (screen === 3) return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 28px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F2A4A', lineHeight: 1.25, marginBottom: 6 }}>Create your account</div>
          <p style={{ fontSize: 14, color: '#64748B', marginBottom: 24, lineHeight: 1.5 }}>Free to start. No credit card required.</p>
          {!authDone ? (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                {([
                  { label: 'Continue with Apple', bg: '#0F2A4A', color: '#fff', icon: '' },
                  { label: 'Continue with Google', bg: '#fff', color: '#334155', icon: 'G', border: '1.5px solid #E2E8F0' },
                ] satisfies { label: string; bg: string; color: string; icon: string; border?: string }[]).map(s => (
                  <button key={s.label} onClick={() => setAuthDone(true)} style={{ flex: 1, padding: '12px 8px', borderRadius: 12, border: s.border ?? 'none', background: s.bg, color: s.color, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14 }}>{s.icon}</span><span>{s.label.replace('Continue with ', '')}</span>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} /><span style={{ fontSize: 12, color: '#94A3B8' }}>or</span><div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email address" style={{ padding: '13px 14px', borderRadius: 12, border: '1.5px solid #E2E8F0', fontSize: 14, color: '#0F2A4A', fontFamily: 'inherit', outline: 'none', background: '#fff' }} />
                <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Create a password" style={{ padding: '13px 14px', borderRadius: 12, border: '1.5px solid #E2E8F0', fontSize: 14, color: '#0F2A4A', fontFamily: 'inherit', outline: 'none', background: '#fff' }} />
              </div>
              <p style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', lineHeight: 1.6 }}>By continuing you agree to our Terms of Service and Privacy Policy. We never sell your data.</p>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0', animation: 'obFadeUp 0.3s ease' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>👋</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0F2A4A', marginBottom: 8 }}>Welcome!</div>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>Account ready. Let&apos;s set up your first goal.</p>
            </div>
          )}
        </div>
      </div>
    );

    if (screen === 4) return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 28px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: 4 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F2A4A', lineHeight: 1.25, marginBottom: 6 }}>What are you working toward?</div>
          <p style={{ fontSize: 14, color: '#64748B', marginBottom: 20, lineHeight: 1.5 }}>Pick your most important goal. You can add more later.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
            {OB_GOALS.map(g => {
              const sel = selGoal?.id === g.id;
              return (
                <button key={g.id} onClick={() => setSelGoal(g)} style={{ padding: '16px 12px', borderRadius: 16, border: '2px solid ' + (sel ? g.color : '#E2E8F0'), background: sel ? g.color + '12' : '#fff', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', gap: 10, alignItems: 'center', transition: 'all 0.15s', textAlign: 'left' }}>
                  <span style={{ fontSize: 24 }}>{g.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: sel ? g.color : '#0F2A4A', lineHeight: 1.3 }}>{g.label}</span>
                </button>
              );
            })}
          </div>
          {selGoal && (
            <div style={{ animation: 'obFadeUp 0.25s ease', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ position: 'relative' }} onClick={() => goalAmountRef.current?.focus()}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, fontWeight: 600, color: '#94A3B8' }}>$</span>
                <input
                  ref={goalAmountRef}
                  type="text"
                  inputMode="decimal"
                  enterKeyHint="next"
                  autoComplete="off"
                  value={goalAmt}
                  onFocus={() => goalAmountRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })}
                  onChange={e => {
                    const next = e.target.value
                      .replace(/[^\d.]/g, '')
                      .replace(/(\..*)\./g, '$1');
                    setGoalAmt(next);
                  }}
                  placeholder="Target amount"
                  style={{ width: '100%', padding: '13px 14px 13px 28px', borderRadius: 12, border: '1.5px solid #E2E8F0', fontSize: 14, fontWeight: 500, color: '#0F2A4A', fontFamily: 'inherit', outline: 'none', background: '#fff' }}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  value={goalDate}
                  onChange={e => setGoalDate(e.target.value)}
                  placeholder="Target date (e.g. Aug 2027)"
                  style={{ width: '100%', padding: '13px 44px 13px 14px', borderRadius: 12, border: '1.5px solid ' + (showDatePicker ? accent : '#E2E8F0'), fontSize: 14, color: '#0F2A4A', fontFamily: 'inherit', outline: 'none', background: '#fff', transition: 'border-color 0.15s' }}
                />
                <button
                  type="button"
                  onClick={() => { setShowDatePicker(v => !v); setPickerYear(new Date().getFullYear()); }}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: showDatePicker ? accent : '#94A3B8', transition: 'color 0.15s' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </button>

                {showDatePicker && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.14)', zIndex: 20, overflow: 'hidden', animation: 'obFadeUp 0.18s ease' }}>
                    {/* Year nav */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px', borderBottom: '1px solid #F1F5F9' }}>
                      <button type="button" onClick={() => setPickerYear(y => y - 1)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#F1F5F9', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>‹</button>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#0F2A4A' }}>{pickerYear}</span>
                      <button type="button" onClick={() => setPickerYear(y => y + 1)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#F1F5F9', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>›</button>
                    </div>
                    {/* Month grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, padding: '10px 12px 12px' }}>
                      {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((mo, i) => {
                        const selected = goalDate === `${mo} ${pickerYear}`;
                        const isPast = pickerYear < new Date().getFullYear() || (pickerYear === new Date().getFullYear() && i < new Date().getMonth());
                        return (
                          <button
                            key={mo}
                            type="button"
                            disabled={isPast}
                            onClick={() => { setGoalDate(`${mo} ${pickerYear}`); setShowDatePicker(false); }}
                            style={{ padding: '8px 4px', borderRadius: 10, border: 'none', background: selected ? accent : 'transparent', color: selected ? '#fff' : isPast ? '#CBD5E1' : '#0F2A4A', fontSize: 13, fontWeight: selected ? 700 : 500, cursor: isPast ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.12s' }}
                          >
                            {mo}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );

    if (screen === 5) {
      const ALL_ACCOUNTS = [
        { id: 'chase',       icon: '🏦', label: 'Chase',            sub: 'Checking & savings accounts' },
        { id: 'fidelity',    icon: '📈', label: 'Fidelity',         sub: 'Brokerage & retirement' },
        { id: 'amex',        icon: '💳', label: 'Amex',             sub: 'Credit cards' },
        { id: 'schwab',      icon: '🏛️', label: 'Schwab',           sub: 'Brokerage & 401(k)' },
        { id: 'bofa',        icon: '🏦', label: 'Bank of America',  sub: 'Checking & savings' },
        { id: 'wellsfargo',  icon: '🐎', label: 'Wells Fargo',      sub: 'Checking & mortgage' },
        { id: 'vanguard',    icon: '📊', label: 'Vanguard',         sub: 'Index funds & IRA' },
        { id: 'citi',        icon: '🌐', label: 'Citi',             sub: 'Credit cards & banking' },
        { id: 'capitalone',  icon: '🔺', label: 'Capital One',      sub: 'Checking & credit cards' },
        { id: 'robinhood',   icon: '🪶', label: 'Robinhood',        sub: 'Stocks & crypto' },
        { id: 'sofi',        icon: '💜', label: 'SoFi',             sub: 'Banking & investing' },
        { id: 'td',          icon: '🍁', label: 'TD Bank',          sub: 'Checking & savings' },
        { id: 'usbank',      icon: '🏢', label: 'US Bank',          sub: 'Checking & savings' },
        { id: 'ally',        icon: '🚗', label: 'Ally',             sub: 'Online savings & auto' },
        { id: 'etrade',      icon: '📉', label: 'E*TRADE',          sub: 'Brokerage & options' },
      ];
      const query = acctSearch.trim().toLowerCase();
      const unlinkedAccounts = ALL_ACCOUNTS.filter(a => !linked.includes(a.id));
      const searchResults = query
        ? unlinkedAccounts.filter(a => a.label.toLowerCase().includes(query) || a.sub.toLowerCase().includes(query))
        : unlinkedAccounts.slice(0, 4);
      const linkedAccounts = ALL_ACCOUNTS.filter(a => linked.includes(a.id));

      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 28px', minHeight: 0 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F2A4A', lineHeight: 1.25, marginBottom: 6 }}>Connect your accounts</div>
          <p style={{ fontSize: 14, color: '#64748B', marginBottom: 6, lineHeight: 1.5 }}>Link at least one account so we can track your progress automatically.</p>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 14 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1a6 6 0 1 1 0 12A6 6 0 0 1 7 1zm0 4v3l2 1" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" /></svg>
            <span style={{ fontSize: 11, color: '#15803D', fontWeight: 600 }}>256-bit encryption · Read-only · CFPB Section 1033 compliant</span>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', marginBottom: 14, flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={acctSearch}
              onChange={e => setAcctSearch(e.target.value)}
              placeholder="Search banks, brokerages, cards…"
              style={{ width: '100%', padding: '11px 14px 11px 36px', borderRadius: 12, border: '1.5px solid #E2E8F0', fontSize: 13, color: '#0F2A4A', fontFamily: 'inherit', outline: 'none', background: '#fff' }}
            />
            {acctSearch && (
              <button onClick={() => setAcctSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: '#E2E8F0', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#64748B' }}>✕</button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {/* Linked accounts */}
            {linkedAccounts.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Connected ({linkedAccounts.length})</div>
                {linkedAccounts.map(a => (
                  <div key={a.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', borderRadius: 16, border: '2px solid #15803D', background: '#F0FDF4', marginBottom: 8 }}>
                    <span style={{ fontSize: 22 }}>{a.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0F2A4A' }}>{a.label}</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>{a.sub}</div>
                    </div>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 14 14"><polyline points="2,7 5.5,10.5 12,4" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Search results / suggestions */}
            {searchResults.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                  {query ? `Results for "${acctSearch}"` : 'Popular institutions'}
                </div>
                {searchResults.map(a => {
                  const isLinking = linking === a.id;
                  return (
                    <div key={a.id} onClick={() => linkAccount(a.id)} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', borderRadius: 16, border: '2px solid #E2E8F0', background: '#fff', marginBottom: 8, cursor: 'pointer', transition: 'all 0.2s' }}>
                      <span style={{ fontSize: 22 }}>{a.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F2A4A' }}>{a.label}</div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>{a.sub}</div>
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        {isLinking ? (
                          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid ' + accent, borderTopColor: 'transparent', animation: 'obSpin 0.7s linear infinite' }} />
                        ) : (
                          <div style={{ fontSize: 12, fontWeight: 700, color: accent, padding: '6px 12px', borderRadius: 8, background: accent + '12', border: '1px solid ' + accent + '30' }}>Connect</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {query && searchResults.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#94A3B8' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>No matches for {`"${acctSearch}"`}</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Try a different name or check spelling.</div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (screen === 6) return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 28px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: 4 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F2A4A', lineHeight: 1.25, marginBottom: 6 }}>Quick risk check</div>
          <p style={{ fontSize: 14, color: '#64748B', marginBottom: 6, lineHeight: 1.5 }}>3 questions to calibrate your investment guidance.</p>
          <div style={{ display: 'flex', gap: 5, marginBottom: 20 }}>
            {RISK_QUESTIONS.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i < riskIdx ? accent : i === riskIdx ? accent + '60' : '#E2E8F0', transition: 'background 0.3s' }} />
            ))}
          </div>
          {riskIdx < 3 ? (
            <div style={{ animation: 'obFadeUp 0.25s ease' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#64748B', marginBottom: 12 }}>Question {riskIdx + 1} of {RISK_QUESTIONS.length}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#0F2A4A', lineHeight: 1.4, marginBottom: 18 }}>{RISK_QUESTIONS[riskIdx].q}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {RISK_QUESTIONS[riskIdx].opts.map((opt, oi) => (
                  <button key={opt} onClick={() => {
                    const newAns = [...riskAns];
                    newAns[riskIdx] = RISK_QUESTIONS[riskIdx].scores[oi];
                    setRiskAns(newAns);
                    if (riskIdx < 2) setTimeout(() => setRiskIdx(riskIdx + 1), 200);
                    else setTimeout(() => setRiskIdx(3), 200);
                  }} style={{ padding: '14px 16px', borderRadius: 14, border: '2px solid ' + (riskAns[riskIdx] === RISK_QUESTIONS[riskIdx].scores[oi] ? accent : '#E2E8F0'), background: riskAns[riskIdx] === RISK_QUESTIONS[riskIdx].scores[oi] ? accent + '12' : '#fff', color: '#0F2A4A', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.15s', lineHeight: 1.4 }}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', animation: 'obFadeUp 0.3s ease' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: risk.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px' }}>🎯</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: risk.color, marginBottom: 6 }}>{risk.label}</div>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 20 }}>{risk.sub}</p>
              <div style={{ background: '#fff', borderRadius: 16, padding: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10 }}>Your reference allocation</div>
                {[
                  { label: 'US Equities', pct: riskScore > 8 ? 55 : 40, color: accent },
                  { label: 'Intl Equities', pct: riskScore > 8 ? 20 : 15, color: '#0369a1' },
                  { label: 'Bonds', pct: riskScore > 8 ? 15 : 35, color: '#7c3aed' },
                  { label: 'Cash', pct: riskScore > 8 ? 5 : 10, color: '#64748B' },
                ].map(a => (
                  <div key={a.label} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: a.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#334155', flex: 1 }}>{a.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0F2A4A' }}>{a.pct}%</span>
                    <div style={{ width: 80, height: 5, borderRadius: 99, background: '#F1F5F9', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: a.pct + '%', borderRadius: 99, background: a.color }} />
                    </div>
                  </div>
                ))}
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 10, lineHeight: 1.5 }}>Educational reference only — not personalized investment advice.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );

    if (screen === 7) return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 28px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: 4 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F2A4A', lineHeight: 1.25, marginBottom: 6 }}>Your dashboard is ready ✨</div>
          <p style={{ fontSize: 14, color: '#64748B', marginBottom: 20, lineHeight: 1.5 }}>Here&apos;s your first look at what the app knows about you.</p>
          <div style={{ background: '#0F2A4A', borderRadius: 20, padding: '20px', marginBottom: 12, color: '#fff', animation: 'obFadeUp 0.3s ease', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(44,122,123,0.2)' }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: '#B2DFDB', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>Net worth</div>
            <div style={{ fontSize: 40, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#fff', marginBottom: 4 }}>
              {revealed ? '$' + countUp.toLocaleString('en-US') : '$0'}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>across {linked.length || 2} linked accounts</div>
          </div>
          {selGoal && (
            <div style={{ background: '#fff', borderRadius: 18, padding: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 12, animation: 'obFadeUp 0.35s ease 200ms both' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: selGoal.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{selGoal.emoji}</div>
                <div><div style={{ fontSize: 14, fontWeight: 700, color: '#0F2A4A' }}>{selGoal.label}</div><div style={{ fontSize: 12, color: '#64748B' }}>Goal created</div></div>
                <div style={{ marginLeft: 'auto', fontSize: 12, padding: '3px 9px', borderRadius: 99, background: '#DCFCE7', color: '#15803D', fontWeight: 700 }}>On Track</div>
              </div>
              <div style={{ height: 5, borderRadius: 99, background: '#F1F5F9', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '0%', borderRadius: 99, background: selGoal.color, animation: 'obBarGrow 1s ease 0.8s both' }} />
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 5 }}>Starting from $0 — let&apos;s build it together.</div>
            </div>
          )}
          <div style={{ background: '#fff', borderRadius: 18, padding: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', animation: 'obFadeUp 0.35s ease 350ms both' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>Alignment Score</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: accent }}>—</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>Calibrating over your first 30 days</div>
              </div>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🎯</div>
            </div>
          </div>
        </div>
      </div>
    );

    return null;
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#FAF7F2', display: 'flex', flexDirection: 'column', zIndex: 90 }}>
      <div style={{ padding: '16px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        {screen > 0 ? (
          <button onClick={back} style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>←</button>
        ) : <div style={{ width: 36 }} />}
        <div style={{ display: 'flex', gap: 5 }}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} style={{ width: i === screen ? 18 : 6, height: 6, borderRadius: 99, transition: 'all 0.3s', background: i <= screen ? accent : '#E2E8F0' }} />
          ))}
        </div>
        {screen < 3 ? (
          <button onClick={() => goTo(3, 1)} style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Skip</button>
        ) : <div style={{ width: 36 }} />}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div key={screen} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: animating ? animOut + ' 0.18s ease forwards' : animIn + ' 0.22s ease' }}>
          {renderScreen()}
        </div>
      </div>
      <div style={{ padding: '12px 28px 40px', flexShrink: 0 }}>
        {screen === 6 && riskIdx < 3 ? null : (
          <button onClick={isLastScreen ? onComplete : next} disabled={!canNext} style={{ width: '100%', padding: '15px', borderRadius: 16, border: 'none', background: canNext ? accent : '#E2E8F0', color: canNext ? '#fff' : '#94A3B8', fontSize: 16, fontWeight: 700, cursor: canNext ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: canNext ? '0 4px 16px ' + accent + '40' : 'none' }}>
            {isLastScreen ? 'Go to my dashboard →' : screen === 3 && !authDone ? 'Create account' : screen === 3 && authDone ? 'Set up my first goal →' : screen === 6 ? 'See my profile →' : 'Continue →'}
          </button>
        )}
      </div>
    </div>
  );
}
