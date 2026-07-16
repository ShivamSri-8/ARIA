# Refund Policy

> **Canonical source of truth**: [`src/lib/data/policy.js`](./src/lib/data/policy.js)
> Keep both files in sync whenever a policy changes.

---

## 1. Return Windows

| Loyalty Tier        | Return Window |
|---------------------|---------------|
| Standard            | 30 days from purchase date |
| Gold                | 45 days from purchase date |
| Platinum            | 45 days from purchase date |

The window is measured from the **purchase date** (not delivery date).
Requests received after the applicable window has closed are automatically
denied unless an override condition applies (see §4).

---

## 2. Non-Refundable Categories

The following product categories are **never eligible for a refund**,
regardless of condition, loyalty tier, or how recently the item was purchased:

- **`digital`** — software licenses, cloud subscriptions, downloadable content
- **`final-sale`** — clearance or as-is items marked final sale at checkout

Requests for these categories are denied immediately with a
`"non-refundable-category"` reason code.

---

## 3. Restocking Fee

A **10% restocking fee** is deducted from the refund amount when **all** of
the following are true:

1. The item is in condition `opened-unused` or `used`.
2. The item is **not** defective or damaged in transit (see §4).

> **Example:** Customer returns a $100 opened-unused item in good condition.
> Refund issued = $90 (10% restocking fee deducted).

No restocking fee is charged on `unopened` items, or on any item that
qualifies for the defective/damaged override (§4).

---

## 4. Defective / Damaged-in-Transit Override

If an item arrives **defective** or **damaged in transit**, it is refundable
**regardless of how long ago it was purchased** — even if the normal return
window has closed.

**Important:** These requests are **not** auto-processed. They are approved
in principle but **flagged for mandatory human review** before the refund is
issued. A support agent must verify the defect/damage claim and add a review
note before processing the payment.

Qualifying conditions:

| Condition            | Behaviour                                       |
|----------------------|-------------------------------------------------|
| `defective`          | Window overridden, full refund, human review required |
| `damaged-in-transit` | Window overridden, full refund, human review required |

No restocking fee is applied to defective or damaged items.

---

## 5. Refund Cap & Escalation

To prevent abuse, the system tracks each customer's refund history over a
**rolling 90-day window**.

| Refunds in last 90 days | Outcome                                              |
|-------------------------|------------------------------------------------------|
| 0 – 2                   | Normal auto-processing (subject to all rules above)  |
| 3 or more               | Request is **escalated to a human agent** — no automatic approval or denial |

When a request is escalated, the customer receives an acknowledgement but the
refund is **not issued automatically**. A human agent reviews the full history
and makes the final decision.

> **Refund cap:** 2 per rolling 90 days.
> **Cap window:** 90 calendar days (rolling, not calendar-month).

---

## 6. Decision Flowchart (Summary)

```
Refund Request Received
       │
       ▼
[1] Category non-refundable? ──YES──▶ DENY (non-refundable-category)
       │ NO
       ▼
[2] Refund cap exceeded (≥2 refunds in last 90 days)?
              ──YES──▶ ESCALATE to human agent
       │ NO
       ▼
[3] Condition defective or damaged-in-transit?
              ──YES──▶ APPROVE + flag requiresHumanNote (human review before processing)
       │ NO
       ▼
[4] Within return window for loyalty tier?
              ──NO──▶ DENY (window-expired)
       │ YES
       ▼
[5] Condition opened-unused or used?
              ──YES──▶ APPROVE with 10% restocking fee deducted
       │ NO (unopened)
       ▼
       APPROVE (full refund)
```

---

## 7. Quick Reference

| Rule                     | Value / Detail                          |
|--------------------------|-----------------------------------------|
| Standard window          | 30 days                                 |
| Gold / Platinum window   | 45 days                                 |
| Non-refundable categories| `digital`, `final-sale`                 |
| Defective/damaged override | Approved, full refund, human review   |
| Restocking fee           | 10% on `opened-unused` / `used` (not defective/damaged) |
| Refund cap               | 2 per 90-day rolling window             |
| Cap exceeded action      | Escalate to human agent                 |
