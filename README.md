# Align — Goals-Driven Fintech Platform

A personal finance mobile app prototype built as a case study for a goals-driven PFM product. The core thesis: reframe money management around the life a person is trying to build — not the accounts they happen to hold. Every screen, transaction, and nudge is rendered through the lens of user-defined life goals.

> *"For people who want their money to support the life they're building — not just track what they spent."*

---

## Product Overview

### The Problem

Most PFM tools are retrospective (what did you spend?) and account-centric (here are your balances). Users lack a coherent narrative across their 3–7 accounts and have no way to answer the only question that matters: *what does today's spending mean for the life I'm trying to build?*

### The Approach

Align is organized around four product principles:

- **Goals as the spine** — every screen renders financial state through the lens of user-defined milestones (home purchase, retirement, education, sabbatical, etc.)
- **Show the math** — every nudge, projection, and recommendation surfaces its reasoning in plain language via a "Why?" affordance
- **Compassion over shame** — no deficit framing, no streaks, no leaderboards; guidance treats users as adults navigating trade-offs
- **Information, not advice** — projections and educational reference allocations; no personalized investment advice (regulatory boundary maintained per SEC Investment Advisers Act)

### Target Users

| Persona | Description |
|---------|-------------|
| Aspiring homeowner (Sarah, 29) | Disciplined saver anxious about whether her plan is "enough"; wants reassurance, not rules |
| Values-conscious spender (Marcus, 38) | Comfortable income but money "leaks"; wants to spend with intention, not guilt |
| Hands-off investor (Jordan, 47) | Portfolio spread across 6+ accounts; wants allocation guidance without becoming an expert |

---

## Core Features

### Life-First Dashboard (Goals Tab)
Goal cards with progress, projected completion date, and status pill (Ahead / On Track / Slightly Behind / At Risk). A single **Goal Alignment Score** (0–100) synthesizes savings consistency, spending alignment, investment fit, and debt trajectory. One **Next Action** card surfaces the highest-impact recommendation with inline reasoning.

### Guided Accounts (Money Tab)
Unified transaction feed across all linked accounts. ML-based categorization with per-user adaptation. Per-transaction **alignment indicators** (aligned / neutral / out-of-sync) configurable by the user. Inline **Predictive Guidance** cards translate category trends into goal-timeline impact, e.g., *"Dining is trending 24% above your goal-aligned pace. At this rate, your home-down-payment shifts ~6 weeks."*

### Mindful Investing (Invest Tab)
Consolidated portfolio view across 401(k), IRA, Roth, taxable brokerage, ESPP, 529. Each account mapped to a user-defined goal. **Allocation drift** flagged against educational reference allocations (clearly disclosed as educational, not personalized advice). **Milestone projections** under conservative / expected / optimistic return assumptions. Read-only at MVP — no trade execution.

### Goal Alignment & Alerts (Alerts Tab)
Proactive, low-noise alerts across six categories: goal trajectory, spending pattern, subscription anomalies, allocation drift, income anomalies, and milestone celebrations. Hard cap of 1 push notification per 24 hours by default. Every alert includes a plain-language "Why am I seeing this?" explanation. Celebrations are a first-class alert type, targeting ≥ 25% of lifetime alert volume.

---

## Onboarding Flow

Welcome → Account creation → First goal definition → Account linking (Plaid) → Risk tolerance (5 questions) → Personalization → Live dashboard with explainability drawer auto-opened

---

## Design System

The visual language targets "calm and trust" — distinct from both institutional blue-and-serif fintech and aggressive neobank gradients.

| Token | Hex | Role |
|-------|-----|------|
| `primary-teal-600` | `#2C7A7B` | Goal cards, primary buttons |
| `primary-teal-100` | `#B2DFDB` | Card backgrounds, charts |
| `navy-900` | `#0F2A4A` | Headlines, top app bar |
| `sand-50` | `#FAF7F2` | Page surface |
| `slate-700` | `#334155` | Primary text |
| `success-600` | `#15803D` | Aligned indicators |
| `caution-600` | `#B45309` | Out-of-sync / drift warnings |
| `error-600` | `#B91C1C` | Genuine errors only — never spend overruns |

Typography: humanist sans-serif display; tabular figures for all currency values. Motion: eased, 200–280ms; reduce-motion preference fully respected.

---

## AI/ML Capabilities

| Capability | Approach |
|------------|----------|
| Transaction categorization | Fine-tuned transformer, ~80-category taxonomy, per-user adaptation from overrides; ≥ 92% top-1 accuracy target |
| Predictive Guidance Engine | Rule-based trigger detection → deterministic payload construction → LLM natural-language synthesis → post-validation against source numbers |
| Goal projection | Deterministic + Monte Carlo; inputs: contribution velocity (trailing 90 days), return assumptions, target amount/date |
| Goal Alignment Score | Composite: savings consistency 30%, spending alignment 30%, investment fit 20%, debt trajectory 20% |
| Subscription detection | Sequence pattern recognition; flags dormant subscriptions; never auto-cancels |

**Explainability requirement:** every numeric output is source-traceable in one tap. No black-box outputs ship.

---

## Monorepo Structure

```
artifacts/
  mobile/           # Expo Router React Native app (main product)
  api-server/       # Express 5 REST API
  api-client-react/ # React API client hooks
  api-zod/          # Shared Zod validation schemas
  api-spec/         # API type contracts
  db/               # Drizzle ORM database layer
  mockup-sandbox/   # Vite + shadcn/ui component preview tool
lib/                # Shared internal libraries
scripts/            # Workspace tooling
```

---

## App Screens

**Onboarding** — welcome → signup → goal setup → risk profile → account linking → ready

**Tabs**
| Tab | Description |
|-----|-------------|
| Goals | Life-First Dashboard — goal cards, alignment score, next action |
| Money | Guided Accounts — unified transaction feed, predictive guidance |
| Invest | Mindful Investing — consolidated portfolio, goal mapping, drift alerts |
| Alerts | Goal Alignment & Alerts — proactive nudges and celebrations |
| Profile | Settings, privacy controls, connected institutions, data export |

**Detail screens** — account detail, holding detail, transaction detail, budget editor, goal editor, rebalance plan, spending detail, subscriptions detail, alert impact

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native, Expo SDK, Expo Router v3 |
| Language | TypeScript 5.9 |
| Styling | NativeWind / Tailwind |
| State | React Context (`AppContext`) with mock data |
| API | Express 5, Pino logger |
| Validation | Zod |
| ORM | Drizzle |
| Package manager | pnpm workspaces |
| Mockup tool | Vite, React, shadcn/ui, Radix UI, Recharts |

---

## Getting Started

```bash
pnpm install

# Run the mobile app
cd artifacts/mobile
pnpm dev          # Expo dev server (iOS/Android/Web)

# Run the API server
cd artifacts/api-server
pnpm dev

# Run the mockup sandbox
cd artifacts/mockup-sandbox
pnpm dev
```

---

## Regulatory Notes

This prototype operates at the boundary of financial information and personalized investment advice. Key design constraints:

- **Allowed:** Educational reference allocations, factual observations about portfolio drift, goal projections with disclosed assumptions
- **Not allowed at MVP:** "You should buy X," "Sell Y," or any specific securities recommendation — these require RIA registration
- Every investing screen carries a persistent disclosure: *"Educational reference, not personalized investment advice."*

---

## Code Review

[REVIEW.md](REVIEW.md) contains a full manual review of the mobile app and API server, covering 5 critical issues, 6 high-severity findings, and 7 medium/low findings with recommended fixes.
