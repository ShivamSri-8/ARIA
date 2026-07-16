# Aria — AI Refund Agent

An AI-powered customer-service agent that evaluates refund requests against a structured company policy in real time. Supports both **text chat** (streamed via the Vercel AI SDK) and **voice** (OpenAI Realtime API over WebRTC), with a live admin dashboard showing every tool call and processed refund.

---

## 1. Setup

```bash
# 1. Clone
git clone <repo-url>
cd aria

# 2. Install dependencies
npm install

# 3. Add your OpenAI key
cp .env.example .env.local
#   → open .env.local and set OPENAI_API_KEY=sk-...

# 4. Start the dev server
npm run dev
#   → http://localhost:3000        — chat UI
#   → http://localhost:3000/admin  — admin dashboard
```

> **Requirements**: Node 18+, an OpenAI API key with access to `gpt-4o` and `gpt-4o-realtime-preview`.

---

## 2. Architecture Overview

### Layers

| Layer | Purpose |
|-------|---------|
| **Data** | Mock customers, orders, and policy constants |
| **Agent backend** | Singleton buses, tool factory, system-prompt builder |
| **API routes** | Chat stream, SSE log feed, Realtime token minter, tool executor |
| **Frontend** | Chat UI, voice button, customer sidebar, admin dashboard |

### File tree

```
aria/
├── .env.example                        # Copy to .env.local — add OPENAI_API_KEY
├── POLICY.md                           # Human-readable refund policy doc
│
└── src/
    ├── app/
    │   ├── layout.js                   # Root layout, metadata, Geist fonts
    │   ├── page.js                     # Chat UI — 3-pane: CustomerCard | ChatPanel
    │   ├── admin/
    │   │   └── page.jsx                # Admin dashboard — LogTimeline | RefundsLedger
    │   └── api/
    │       ├── chat/route.js           # POST  — streamText LLM endpoint
    │       ├── customers/route.js      # GET   — customer picker data
    │       ├── logs/stream/route.js    # GET   — SSE live log feed
    │       ├── refunds/route.js        # GET   — refund ledger snapshot
    │       ├── agent/
    │       │   └── tool-exec/route.js  # POST  — voice-side tool executor
    │       └── realtime/
    │           └── session/route.js    # POST  — ephemeral Realtime token minter
    │
    ├── components/
    │   ├── CustomerPicker.jsx          # Dropdown — fetches /api/customers
    │   ├── CustomerCard.jsx            # Left sidebar — profile + order list
    │   ├── ChatPanel.jsx               # Chat bubbles, tool badges, auto-scroll
    │   ├── VoiceButton.jsx             # WebRTC voice — idle / connecting / live / error
    │   ├── LogTimeline.jsx             # SSE-powered live log viewer (admin)
    │   └── RefundsLedger.jsx           # Polling refund ledger (admin)
    │
    └── lib/
        ├── data/
        │   ├── customers.js            # 15 mock customers + TODAY constant
        │   └── policy.js              # REFUND_POLICY constants
        └── agent/
            ├── logBus.js              # EventEmitter singleton (globalThis)
            ├── refundStore.js         # In-memory refund store (globalThis)
            ├── tools.js               # buildTools(sessionId) — 6 AI SDK tools
            └── prompt.js             # buildSystemPrompt() — policy-aware instructions
```

---

## 3. Tool-Calling Loop

### The six tools

| # | Tool | What it does |
|---|------|-------------|
| 1 | `getCustomerProfile` | Returns name, email, loyalty tier, and order summary |
| 2 | `getOrderDetails` | Returns full order detail including condition and refund history |
| 3 | `checkRefundEligibility` | **Runs the full policy engine** — returns `{ eligible, reasonCode, clause, message, escalate, requiresHumanNote }` |
| 4 | `calculateRefundAmount` | Applies restocking fee if item is opened/used and not defective |
| 5 | `processRefund` | Writes the confirmed refund to `refundStore` |
| 6 | `escalateToHuman` | Logs an escalation event; does NOT process a refund |

### Protocol enforced by the system prompt

The agent is instructed to call tools **in strict order** and is forbidden from skipping steps:

```
1. getCustomerProfile(customerId)
2. getOrderDetails(customerId, orderId)
3. checkRefundEligibility(customerId, orderId)
   ↓ eligible = false → deny and explain; STOP
   ↓ escalate = true  → escalateToHuman(); STOP
   ↓ eligible = true
4. calculateRefundAmount(customerId, orderId, isDefectiveOverride)
5. processRefund(...)
```

`checkRefundEligibility` encodes all policy branches in a single place:

```
nonRefundableCategories (digital, final-sale)
  → eligible: false, reasonCode: "non-refundable-category"

purchaseAge > returnWindow (30d standard / 45d gold+platinum)
  AND condition NOT IN overrideConditions
    → eligible: false, reasonCode: "expired-window"

purchaseAge > returnWindow
  AND condition IN (defective, damaged-in-transit)
    → eligible: true, reasonCode: "defective-damaged-override",
      requiresHumanNote: true

refundStore.countInWindow(customerId, 90) >= refundCap (2)
    → escalate: true, reasonCode: "refund-cap-exceeded"

Otherwise
    → eligible: true, reasonCode: "clean-approval"
```

`maxSteps: 6` in the chat route caps the LLM at exactly enough steps to complete the full 5-step tool chain without runaway loops.

### Logging

Every tool call is wrapped by `withLogging()` in `tools.js`, which publishes `tool_call` before execution and `tool_result` / `tool_error` (with `durationMs`) after — regardless of whether the call came from text chat or voice.

---

## 4. Admin Log Stream

### How it works

```
logBus (server, in-memory EventEmitter on globalThis.__ariaLogBus)
  │
  ├── publish(event)  ← called by withLogging() on every tool call
  │                   ← called by api/chat/route.js on user/agent messages
  │
  └── "log" event
        │
        ↓
  /api/logs/stream  (GET, SSE)
        │   ├── On connect: replay getHistory() as individual data: frames
        │   ├── On new log: forward via ReadableStream enqueue
        │   └── Every 15s: ": heartbeat\n\n" to prevent idle timeout
        │
        ↓
  LogTimeline.jsx (client)
        ├── new EventSource("/api/logs/stream")
        ├── Appends events to state, capped at 300
        ├── Auto-scrolls to newest
        └── Session filter dropdown from distinct sessionIds seen
```

### Event types and colour coding

| Type | Colour | Description |
|------|--------|-------------|
| `session_start` | Gray | A new chat or voice session began |
| `user_message` | Gray | The customer's incoming message |
| `agent_message` | Gray | The LLM's final text response |
| `tool_call` | **Amber** | A tool was invoked (args shown) |
| `tool_result` | **Green** | Tool returned successfully (result + duration) |
| `tool_error` | **Red** | Tool threw an error |
| `decision` | **Purple** | Eligibility decision logged |
| `escalation` | **Orange** | Case escalated to a human agent |

### Hot-reload safety

`logBus` and `refundStore` are both stashed on `globalThis` with an `if (!globalThis.__ariaXxx)` guard. Next.js hot-reloads re-evaluate module files but do not restart the Node process, so the singletons survive — `/api/refunds` will still show data processed before the reload.

---

## 5. Voice Mode

### How the ephemeral token flow works

```
Browser                              Server                        OpenAI
  │                                     │                              │
  │ — POST /api/realtime/session ──────▶│                              │
  │                                     │ POST /v1/realtime/sessions   │
  │                                     │  model: gpt-4o-realtime-prev │
  │                                     │  voice: verse                │
  │                                     │  instructions: systemPrompt  │
  │                                     │  tools: [6 JSON schemas] ───▶│
  │◀── { client_secret: { value } } ────│◀─── ephemeral token ─────────│
  │                                     │                              │
  │ getUserMedia (mic) + RTCPeerConn    │                              │
  │ createDataChannel("oai-events")     │                              │
  │                                     │                              │
  │ — POST /v1/realtime?model=... ──────────────────────────────────▶ │
  │   Authorization: Bearer <ephemeral> │                              │
  │   Content-Type: application/sdp     │                              │
  │   Body: SDP offer                   │                              │
  │◀──────────────────── SDP answer ─────────────────────────────────│
  │                                     │                              │
  │ ◀══ audio stream (WebRTC) ══════════════════════════════════════▶ │
```

`OPENAI_API_KEY` is **never sent to the browser**. The ephemeral token is scoped and expires after ~60 seconds (OpenAI's limit); it can only establish the one session.

### Tool-exec bridge

When the Realtime model decides to call a tool, it emits a `response.function_call_arguments.done` message on the data channel. `VoiceButton.jsx` handles this:

```
DataChannel message (response.function_call_arguments.done)
  { call_id, name: toolName, arguments: "{...}" }
    │
    ▼
POST /api/agent/tool-exec
  { sessionId, toolName, args }   ← same sessionId as the text ChatPanel
    │
    ▼
buildTools(sessionId)[toolName].execute(args, {})
  → policy logic runs + logBus publishes (identical to text chat)
    │
    ▼
DataChannel send ← conversation.item.create (function_call_output)
DataChannel send ← response.create           (resume model speech)
```

Because both text and voice use the **same `sessionId`**, all tool calls from a single customer conversation appear together in the admin log timeline regardless of whether the agent was spoken to or typed at.

---

## 6. Demo Scenarios — Mock Customer Table

All dates are relative to `TODAY = "2026-07-13"`. Pick a customer from the dropdown and use the suggested prompt or click **"Ask about this order →"** on any order card.

### ✅ Clean Approval

| Customer | Order | Product | Days Old | Tier | Condition | Notes |
|----------|-------|---------|----------|------|-----------|-------|
| Alice Navarro `cust-001` | ORD-001 | Wireless Headphones | 10 | Standard | Unopened | Straightforward full refund |
| Marcus Webb `cust-002` | ORD-003 | Merino Wool Sweater | 20 | Gold | Unopened | Gold tier, well within 45-day window |
| Eli Johansson `cust-004` | ORD-007 | Stand Mixer | 40 | **Platinum** | Unopened | 40 days < 45-day Platinum window |
| Tom Bergström `cust-006` | ORD-011 | Running Shorts | 28 | Standard | **Used** | Approved + **10% restocking fee** deducted |

### ❌ Expired Window Denial

| Customer | Order | Product | Days Old | Tier | Window | Notes |
|----------|-------|---------|----------|------|--------|-------|
| Priya Sharma `cust-003` | ORD-005 | Bluetooth Speaker | **35** | Standard | 30 days | 35 > 30 — denied |
| Yuki Tanaka `cust-007` | ORD-013 | Air Purifier | **50** | Gold | 45 days | 50 > 45 — denied |

### 🚫 Non-Refundable Category Denial

| Customer | Order | Product | Category | Notes |
|----------|-------|---------|----------|-------|
| Fatima Al-Hassan `cust-005` | ORD-009 | Clearance Denim Jacket | **final-sale** | Denied regardless of age or condition |
| Soren Dahl `cust-008` | ORD-015 | Photoshop Annual License | **digital** | Denied — digital goods are non-refundable |
| Amara Osei `cust-009` | ORD-017 | Cloud Storage Plan | **digital** | Denied even though only 5 days old |

### ⚠️ Defective / Damaged Override (Approved + Human Review Flag)

| Customer | Order | Product | Days Old | Condition | Notes |
|----------|-------|---------|----------|-----------|-------|
| Ingrid Müller `cust-010` | ORD-019 | Smart Watch | 40 | **Defective** | 40 > 30d standard window, but override applies; `requiresHumanNote: true` |
| Carlos Reyes `cust-011` | ORD-021 | Espresso Machine | 60 | **Damaged-in-transit** | 60 > 45d gold window, override applies; human review required |
| Nadia Petrov `cust-012` | ORD-023 | Robot Vacuum Cleaner | 50 | **Defective** | 50 > 30d standard window, override applies; human review required |

### 🔁 Refund Cap Exceeded — Escalate to Human

| Customer | Order | Product | Tier | Prior Refunds (90 days) | Notes |
|----------|-------|---------|------|------------------------|-------|
| Léa Fontaine `cust-013` | ORD-025 | Portable Projector | Gold | **3** | Exceeds cap of 2 → escalated |
| Omar Khalil `cust-014` | ORD-027 | Gaming Mouse | Standard | **2** | Exactly at cap → escalated |
| Bianca Rossi `cust-015` | ORD-029 | 4K Monitor | **Platinum** | **2** | Even Platinum tier hits the cap |

---

## Policy Quick Reference

| Parameter | Value |
|-----------|-------|
| Return window — Standard | 30 days |
| Return window — Gold / Platinum | 45 days |
| Non-refundable categories | `digital`, `final-sale` |
| Defective/damaged override | Approved regardless of window; `requiresHumanNote: true` |
| Restocking fee | 10% when condition is `opened-unused` or `used` (not defective) |
| Refund cap | 2 refunds per customer per 90-day rolling window |
| Cap exceeded action | Escalate to human (not auto-deny) |

Full rules: [`POLICY.md`](./POLICY.md) · Machine-readable constants: [`src/lib/data/policy.js`](./src/lib/data/policy.js)
