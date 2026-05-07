import { T } from './tokens';

export interface Goal {
  id: number;
  emoji: string;
  label: string;
  target: number;
  current: number;
  targetDate: string;
  status: string;
  color: string;
  pct: number;
}

export interface Txn {
  id: number;
  merchant: string;
  amount: number;
  cat: string;
  align: 'aligned' | 'neutral' | 'out-of-sync';
  date: string;
  acct: string;
}

export interface Alert {
  id: number;
  type: string;
  icon: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export interface Holding {
  name: string;
  value: number;
  pct: number;
  ref: number;
  goal: string;
}

export const GOALS: Goal[] = [
  { id:1, emoji:'🏠', label:'Home Down Payment', target:120000, current:48200, targetDate:'Aug 2027', status:'On Track', color:T.teal600, pct:40 },
  { id:2, emoji:'🎓', label:"Kids' Education Fund", target:80000, current:22400, targetDate:'Sep 2033', status:'Ahead', color:'#0369a1', pct:28 },
  { id:3, emoji:'🌴', label:'Early Retirement', target:1200000, current:180000, targetDate:'Dec 2042', status:'Slightly Behind', color:'#7c3aed', pct:15 },
];

export const TXNS: Txn[] = [
  { id:1,  merchant:'Whole Foods Market', amount:-147.32, cat:'Groceries',    align:'aligned',     date:'Today',     acct:'Chase Checking' },
  { id:2,  merchant:'Netflix',            amount:-15.99,  cat:'Subscriptions',align:'neutral',      date:'Today',     acct:'Amex Platinum' },
  { id:3,  merchant:'Paycheck — Acme',    amount:4200.00, cat:'Income',       align:'aligned',     date:'Yesterday', acct:'Chase Checking' },
  { id:4,  merchant:'Erewhon',            amount:-88.50,  cat:'Dining',       align:'out-of-sync', date:'Yesterday', acct:'Chase Checking' },
  { id:5,  merchant:'Equinox',            amount:-180.00, cat:'Health',       align:'aligned',     date:'May 3',     acct:'Amex Platinum' },
  { id:6,  merchant:'Starbucks',          amount:-6.75,   cat:'Coffee',       align:'neutral',      date:'May 3',     acct:'Chase Checking' },
  { id:7,  merchant:'Spotify',            amount:-9.99,   cat:'Subscriptions',align:'neutral',      date:'May 2',     acct:'Amex Platinum' },
  { id:8,  merchant:"Trader Joe's",       amount:-63.14,  cat:'Groceries',    align:'aligned',     date:'May 2',     acct:'Chase Checking' },
  { id:9,  merchant:'Lyft',               amount:-22.40,  cat:'Transport',    align:'neutral',      date:'May 1',     acct:'Chase Checking' },
  { id:10, merchant:'OpenAI',             amount:-20.00,  cat:'Subscriptions',align:'neutral',      date:'May 1',     acct:'Amex Platinum' },
];

export const ALERTS: Alert[] = [
  { id:1, type:'celebration', icon:'🎉', title:'Halfway to your home goal!',       body:"You've crossed $48K — 40% of your $120K target. At this pace, you're 2 months ahead of schedule.", time:'2h ago', read:false },
  { id:2, type:'spending',    icon:'⚡', title:'Dining trending high this month',   body:'Dining is 24% above your goal-aligned pace. At this rate, your home timeline shifts ~6 weeks. Tap to see details.', time:'Yesterday', read:false },
  { id:3, type:'subscription',icon:'📦', title:'Unused subscription renewal',      body:'Your annual Duolingo subscription renews in 5 days at $83.99. Last login: 4 months ago.', time:'2 days ago', read:true },
  { id:4, type:'investing',   icon:'📊', title:'Portfolio drift detected',          body:'Your retirement portfolio is 11% more conservative than the reference for your 16-year horizon. Tap to learn more.', time:'3 days ago', read:true },
  { id:5, type:'income',      icon:'💰', title:'Unusual deposit detected',          body:'A deposit of $4,200 is slightly larger than your typical paycheck. Expected? Tap to classify.', time:'4 days ago', read:true },
];

export const HOLDINGS: Holding[] = [
  { name:'US Equities (VTI)',  value:72400, pct:40, ref:45, goal:'Early Retirement' },
  { name:'Intl Equities (VXUS)',value:36200, pct:20, ref:20, goal:'Early Retirement' },
  { name:'Bonds (BND)',         value:29600, pct:16, ref:25, goal:'Early Retirement' },
  { name:'529 Plan',            value:22400, pct:12, ref:15, goal:"Kids' Education" },
  { name:'Cash & Equivalents',  value:21800, pct:12, ref:5,  goal:'Home Down Payment' },
];

export const TXN_GOAL_IMPACT: Record<number, {
  type: string;
  summary: string;
  goalShifts: { goalId:number; emoji:string; label:string; shiftDays:number; shiftDir:string; color:string; note:string }[];
  monthlyContext: { cat:string; spent:number; budget:number; pct:number } | null;
  tip: string | null;
}> = {
  1:  { type:'aligned', summary:'This grocery spend is within your aligned pace — no goal timeline change.',
    goalShifts:[
      { goalId:1, emoji:'🏠', label:'Home Down Payment', shiftDays:0, shiftDir:'none', color:'#2C7A7B', note:'Groceries are within your $280/mo pace. No impact.' },
      { goalId:3, emoji:'🌴', label:'Early Retirement',  shiftDays:0, shiftDir:'none', color:'#7c3aed', note:'Well within aligned spending. No retirement impact.' },
    ], monthlyContext:{ cat:'Groceries', spent:210, budget:280, pct:75 }, tip:"You're on track — spending $210 of your $280 grocery budget so far this month." },
  2:  { type:'neutral', summary:'Subscription spend is neutral — tracked but not flagged against any goal.',
    goalShifts:[{ goalId:1, emoji:'🏠', label:'Home Down Payment', shiftDays:0, shiftDir:'none', color:'#2C7A7B', note:'Subscriptions are categorized as neutral for this goal.' }],
    monthlyContext:{ cat:'Subscriptions', spent:46, budget:60, pct:77 }, tip:'Netflix is $15.99/mo. You have 2 other active streaming subscriptions — consider an annual audit.' },
  3:  { type:'aligned', summary:'Income event — your paycheck positively affects all active goals.',
    goalShifts:[
      { goalId:1, emoji:'🏠', label:'Home Down Payment',  shiftDays:-14, shiftDir:'ahead', color:'#2C7A7B', note:'This paycheck enables $400 auto-contribution this cycle. Timeline moves 2 weeks earlier.' },
      { goalId:2, emoji:'🎓', label:"Kids' Education",    shiftDays:-7,  shiftDir:'ahead', color:'#0369a1', note:'Paycheck covers $200 529 contribution. Slightly ahead of pace.' },
      { goalId:3, emoji:'🌴', label:'Early Retirement',   shiftDays:-21, shiftDir:'ahead', color:'#7c3aed', note:'401(k) contribution of $650 from this paycheck. +3 weeks ahead.' },
    ], monthlyContext:null, tip:'Great — your savings contributions are scheduled automatically from each paycheck.' },
  4:  { type:'out-of-sync', summary:'Dining is running 24% above your aligned pace this month — timelines shift.',
    goalShifts:[
      { goalId:1, emoji:'🏠', label:'Home Down Payment',  shiftDays:42, shiftDir:'behind', color:'#2C7A7B', note:'At current dining pace, home goal shifts ~6 weeks later. Reducing by $100/mo would recover 3 weeks.' },
      { goalId:2, emoji:'🎓', label:"Kids' Education",    shiftDays:14, shiftDir:'behind', color:'#0369a1', note:'Education fund absorbs a 2-week delay at current spending rate.' },
      { goalId:3, emoji:'🌴', label:'Early Retirement',   shiftDays:7,  shiftDir:'behind', color:'#7c3aed', note:'Small indirect effect — retirement goal shifts ~1 week.' },
    ], monthlyContext:{ cat:'Dining', spent:340, budget:200, pct:170 }, tip:'Dining this month: $340 vs. $200 aligned pace. One fewer restaurant meal/week saves ~$120/mo.' },
  5:  { type:'aligned', summary:"Health & wellness spending is within your aligned values — no timeline change.",
    goalShifts:[
      { goalId:1, emoji:'🏠', label:'Home Down Payment', shiftDays:0, shiftDir:'none', color:'#2C7A7B', note:'Health is marked as an aligned category. No home goal impact.' },
      { goalId:3, emoji:'🌴', label:'Early Retirement',  shiftDays:0, shiftDir:'none', color:'#7c3aed', note:'Aligned spend — no effect on retirement timeline.' },
    ], monthlyContext:{ cat:'Health', spent:180, budget:200, pct:90 }, tip:"Equinox is $180/mo. You've used it 12× this month — strong utilization." },
  6:  { type:'neutral', summary:'Small coffee purchase — minimal goal impact individually.',
    goalShifts:[{ goalId:1, emoji:'🏠', label:'Home Down Payment', shiftDays:0, shiftDir:'none', color:'#2C7A7B', note:'At $6.75 this transaction has negligible impact on your home timeline.' }],
    monthlyContext:{ cat:'Coffee', spent:48, budget:60, pct:80 }, tip:"If you buy coffee daily ($6.75 × 30), that's $202/mo — equivalent to 2.4 days of home savings." },
  7:  { type:'neutral', summary:'Subscription within neutral budget — no goal impact.',
    goalShifts:[{ goalId:1, emoji:'🏠', label:'Home Down Payment', shiftDays:0, shiftDir:'none', color:'#2C7A7B', note:'Subscription categorized as neutral. No direct goal impact.' }],
    monthlyContext:{ cat:'Subscriptions', spent:46, budget:60, pct:77 }, tip:'Spotify at $9.99/mo. Switching to an annual plan saves ~$24/yr.' },
  8:  { type:'aligned', summary:'Grocery spend is well within pace — contributes to a healthy alignment score.',
    goalShifts:[
      { goalId:1, emoji:'🏠', label:'Home Down Payment', shiftDays:0, shiftDir:'none', color:'#2C7A7B', note:'Groceries are on-pace. No home goal impact.' },
      { goalId:3, emoji:'🌴', label:'Early Retirement',  shiftDays:0, shiftDir:'none', color:'#7c3aed', note:'Aligned spending reinforces your Alignment Score.' },
    ], monthlyContext:{ cat:'Groceries', spent:210, budget:280, pct:75 }, tip:"You're tracking $70 under your grocery pace for the month." },
  9:  { type:'neutral', summary:'Transport spend is within pace — no goal timeline shift.',
    goalShifts:[{ goalId:1, emoji:'🏠', label:'Home Down Payment', shiftDays:0, shiftDir:'none', color:'#2C7A7B', note:'Transport is neutral for your home goal.' }],
    monthlyContext:{ cat:'Transport', spent:88, budget:120, pct:73 }, tip:"You've spent $88 of your $120 transport budget so far this month." },
  10: { type:'neutral', summary:'Software subscription tracked as neutral — no goal impact.',
    goalShifts:[{ goalId:1, emoji:'🏠', label:'Home Down Payment', shiftDays:0, shiftDir:'none', color:'#2C7A7B', note:'Categorized as neutral software subscription.' }],
    monthlyContext:{ cat:'Subscriptions', spent:46, budget:60, pct:77 }, tip:'You have 4 active software subscriptions totaling $46/mo.' },
};

export const CATEGORY_DATA: Record<string, {
  align: string; budget: number; icon: string; color: string;
  months: { month: string; spent: number; current?: boolean }[];
  txns: { id: string; merchant: string; amount: number; date: string; acct: string; align: string }[];
  insight: string;
  goalImpact: { goalEmoji: string; goalLabel: string; status: string; note: string };
}> = {
  Groceries: {
    align:'aligned', budget:280, icon:'🛒', color:'#2C7A7B',
    months:[
      { month:'Nov', spent:241 },{ month:'Dec', spent:298 },{ month:'Jan', spent:255 },
      { month:'Feb', spent:219 },{ month:'Mar', spent:263 },{ month:'Apr', spent:237 },
      { month:'May', spent:210, current:true },
    ],
    txns:[
      { id:'g1', merchant:'Whole Foods Market', amount:-147.32, date:'Today', acct:'Chase Checking', align:'aligned' },
      { id:'g2', merchant:"Trader Joe's",       amount:-63.14,  date:'May 2', acct:'Chase Checking', align:'aligned' },
    ],
    insight:"You're tracking $70 under budget this month. Your 6-month average is $252 — well within your $280 pace.",
    goalImpact:{ goalEmoji:'🏠', goalLabel:'Home Down Payment', status:'none', note:'Groceries are on-pace. No home goal impact this month.' },
  },
  Dining: {
    align:'out-of-sync', budget:200, icon:'🍽️', color:'#B45309',
    months:[
      { month:'Nov', spent:187 },{ month:'Dec', spent:312 },{ month:'Jan', spent:198 },
      { month:'Feb', spent:174 },{ month:'Mar', spent:221 },{ month:'Apr', spent:263 },
      { month:'May', spent:340, current:true },
    ],
    txns:[
      { id:'d1', merchant:'Erewhon',     amount:-88.50,  date:'Yesterday', acct:'Chase Checking', align:'out-of-sync' },
      { id:'d2', merchant:'Nobu',        amount:-142.00, date:'May 4',     acct:'Amex Platinum',  align:'out-of-sync' },
      { id:'d3', merchant:'Blue Bottle', amount:-18.50,  date:'May 3',     acct:'Chase Checking', align:'neutral' },
      { id:'d4', merchant:'Sweetgreen',  amount:-16.80,  date:'May 1',     acct:'Chase Checking', align:'neutral' },
    ],
    insight:'Dining is 70% over pace this month — your highest overage in 6 months. The $142 Nobu dinner accounts for 42% of the excess.',
    goalImpact:{ goalEmoji:'🏠', goalLabel:'Home Down Payment', status:'behind', note:'At current pace, home goal shifts ~6 weeks. Cutting dining by $100/mo recovers 3 weeks.' },
  },
  Transport: {
    align:'aligned', budget:120, icon:'🚗', color:'#0369a1',
    months:[
      { month:'Nov', spent:104 },{ month:'Dec', spent:88  },{ month:'Jan', spent:112 },
      { month:'Feb', spent:96  },{ month:'Mar', spent:118 },{ month:'Apr', spent:101 },
      { month:'May', spent:88, current:true },
    ],
    txns:[
      { id:'t1', merchant:'Lyft',      amount:-22.40, date:'May 1',  acct:'Chase Checking', align:'neutral' },
      { id:'t2', merchant:'Shell Gas', amount:-65.60, date:'Apr 30', acct:'Chase Checking', align:'neutral' },
    ],
    insight:'Transport is running $32 under budget. Your 6-month average is $101 — consistently below your $120 pace.',
    goalImpact:{ goalEmoji:'🏠', goalLabel:'Home Down Payment', status:'none', note:'Transport on-pace. No impact on your home goal this month.' },
  },
  Subscriptions: {
    align:'neutral', budget:60, icon:'📱', color:'#64748B',
    months:[
      { month:'Nov', spent:45 },{ month:'Dec', spent:55 },{ month:'Jan', spent:46 },
      { month:'Feb', spent:46 },{ month:'Mar', spent:46 },{ month:'Apr', spent:46 },
      { month:'May', spent:46, current:true },
    ],
    txns:[
      { id:'s1', merchant:'Netflix', amount:-15.99, date:'Today', acct:'Amex Platinum', align:'neutral' },
      { id:'s2', merchant:'Spotify', amount:-9.99,  date:'May 2', acct:'Amex Platinum', align:'neutral' },
      { id:'s3', merchant:'OpenAI',  amount:-20.00, date:'May 1', acct:'Amex Platinum', align:'neutral' },
    ],
    insight:'Subscriptions are flat at $46/mo — 4 active services. Duolingo renews in 5 days at $83.99/yr.',
    goalImpact:{ goalEmoji:'🏠', goalLabel:'Home Down Payment', status:'none', note:'Subscriptions tracked as neutral. No direct goal impact.' },
  },
};

export const GOAL_TEMPLATES = [
  { id:'home',       emoji:'🏠', label:'Home',           sub:'Down payment or renovation',  color:'#2C7A7B', suggestAmt:120000, suggestYrs:3  },
  { id:'retirement', emoji:'🌴', label:'Retirement',     sub:'Build your future nest egg',   color:'#7c3aed', suggestAmt:1000000,suggestYrs:20 },
  { id:'education',  emoji:'🎓', label:'Education',      sub:'College fund or tuition',      color:'#0369a1', suggestAmt:80000,  suggestYrs:10 },
  { id:'travel',     emoji:'✈️',  label:'Travel',         sub:'Dream trip or sabbatical',     color:'#b45309', suggestAmt:8000,   suggestYrs:2  },
  { id:'emergency',  emoji:'🛡️',  label:'Emergency Fund', sub:'3–6 months of expenses',      color:'#15803D', suggestAmt:20000,  suggestYrs:1  },
  { id:'car',        emoji:'🚗', label:'New Vehicle',    sub:'Car, EV, or motorcycle',       color:'#dc2626', suggestAmt:35000,  suggestYrs:2  },
  { id:'wedding',    emoji:'💍', label:'Wedding',        sub:'Your perfect day',             color:'#db2777', suggestAmt:30000,  suggestYrs:2  },
  { id:'business',   emoji:'💼', label:'Business',       sub:'Launch or grow a venture',     color:'#92400e', suggestAmt:50000,  suggestYrs:3  },
  { id:'custom',     emoji:'⭐', label:'Something else', sub:'Set your own goal',            color:'#64748B', suggestAmt:10000,  suggestYrs:2  },
];

export const LINK_ACCOUNTS = [
  { id:'chase',    icon:'🏦', label:'Chase Checking',     balance:'$12,400' },
  { id:'fidelity', icon:'📈', label:'Fidelity Brokerage', balance:'$72,400' },
  { id:'savings',  icon:'💰', label:'Chase Savings',      balance:'$35,800' },
];

export const OB_GOALS = [
  { id:'home',       emoji:'🏠', label:'Buy a home',       color:'#2C7A7B' },
  { id:'retirement', emoji:'🌴', label:'Retire early',     color:'#7c3aed' },
  { id:'education',  emoji:'🎓', label:'Education fund',   color:'#0369a1' },
  { id:'travel',     emoji:'✈️',  label:'Dream trip',       color:'#b45309' },
  { id:'emergency',  emoji:'🛡️',  label:'Emergency fund',  color:'#15803D' },
  { id:'business',   emoji:'💼', label:'Start a business', color:'#92400e' },
];

export const RISK_QUESTIONS = [
  { q:'If your portfolio dropped 20% in a month, you would:', opts:['Sell everything immediately','Sell some to reduce risk','Hold and wait','Buy more — great opportunity'], scores:[1,2,3,4] },
  { q:'Your primary investing goal is:', opts:['Preserving what I have','Modest, steady growth','Strong long-term growth','Maximum growth, high risk ok'], scores:[1,2,3,4] },
  { q:"How long before you'll need this money?", opts:['Less than 2 years','2–5 years','5–15 years','15+ years'], scores:[1,2,3,4] },
];

export const CHAT_SYSTEM_PROMPT = `You are a compassionate, transparent financial guidance assistant for a goals-driven personal finance app. You help users understand their financial alignment score, spending patterns, and goal progress.

The user's current financial snapshot:
- Goal Alignment Score: 74/100 (up +3 this month)
  - Savings Rate Consistency: 82/100
  - Spending Alignment: 68/100
  - Investment Fit: 70/100
  - Debt Trajectory: 80/100
- Active goals: Home Down Payment ($48,200 / $120,000, On Track, Aug 2027), Kids' Education ($22,400 / $80,000, Ahead), Early Retirement ($180,000 / $1,200,000, Slightly Behind)
- Monthly spending alerts: Dining is 70% over pace ($340 vs $200 budget)
- Net worth: $248,600 | Liquid: $48,200 | Debt: $0
- Portfolio: $180,000 across 401(k), IRA, and brokerage. 40% US equities, 20% intl, 16% bonds, 12% cash (cash is overweight vs reference).

Guidelines:
- Always explain your reasoning clearly — show the math when relevant
- Be compassionate, never judgmental or preachy
- You provide information and education, NOT personalized investment advice
- Keep responses concise (3-5 sentences max) unless the user asks for more detail
- If asked about specific buy/sell recommendations, explain you provide educational guidance only
- Use plain language, not financial jargon
- Always end with one practical, actionable suggestion when relevant`;

export const SUGGESTED_QUESTIONS = [
  "Why is my score 74?",
  "How does dining affect my home goal?",
  "Am I on track for retirement?",
  "What would happen if I saved $200 more/month?",
  "Why is my cash position flagged?",
  "How can I improve my alignment score?",
];
