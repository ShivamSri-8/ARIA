/**
 * tools.js
 * --------
 * Factory that builds the six AI SDK v4 tool definitions used by the Aria
 * refund agent. Each tool instrument itself via logBus: emitting tool_call
 * before execution and tool_result (or tool_error on throw) after, with
 * durationMs measured.
 *
 * Usage:
 *   const tools = buildTools(sessionId);
 *   // Pass `tools` to streamText / generateText from the `ai` package.
 */

import { tool } from "ai";
import { z } from "zod";
import { customers, TODAY } from "@/lib/data/customers";
import { REFUND_POLICY } from "@/lib/data/policy";
import logBus from "@/lib/agent/logBus";
import refundStore from "@/lib/agent/refundStore";

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Wrap an async tool executor so it auto-publishes tool_call before running
 * and tool_result / tool_error after, including durationMs.
 *
 * @param {string} sessionId
 * @param {string} toolName
 * @param {(args: any) => Promise<any>} fn
 * @returns {(args: any) => Promise<any>}
 */
function withLogging(sessionId, toolName, fn) {
  return async (args) => {
    logBus.publish({
      sessionId,
      type: "tool_call",
      label: toolName,
      detail: { args },
    });
    const start = Date.now();
    try {
      const result = await fn(args);
      const durationMs = Date.now() - start;
      logBus.publish({
        sessionId,
        type: "tool_result",
        label: toolName,
        detail: { result },
        durationMs,
      });
      return result;
    } catch (err) {
      const durationMs = Date.now() - start;
      logBus.publish({
        sessionId,
        type: "tool_error",
        label: toolName,
        detail: { error: err?.message ?? String(err) },
        durationMs,
      });
      throw err;
    }
  };
}

/**
 * Look up a customer by id. Throws a descriptive error if not found.
 * @param {string} customerId
 */
function findCustomer(customerId) {
  const customer = customers.find((c) => c.id === customerId);
  if (!customer) throw new Error(`Customer not found: ${customerId}`);
  return customer;
}

/**
 * Look up an order within a customer's orders. Throws if not found.
 * @param {{ orders: any[] }} customer
 * @param {string} orderId
 */
function findOrder(customer, orderId) {
  const order = customer.orders.find((o) => o.orderId === orderId);
  if (!order)
    throw new Error(
      `Order ${orderId} not found for customer ${customer.id}`
    );
  return order;
}

/**
 * Calculate the age of an order in calendar days from TODAY.
 * @param {string} purchaseDate - ISO date string (YYYY-MM-DD)
 * @returns {number}
 */
function orderAgeDays(purchaseDate) {
  const purchase = new Date(purchaseDate).getTime();
  const today = new Date(TODAY).getTime();
  return Math.floor((today - purchase) / (1000 * 60 * 60 * 24));
}

/**
 * Return the allowed return window in days for a loyalty tier.
 * @param {string} loyaltyTier
 * @returns {number}
 */
function windowDays(loyaltyTier) {
  return loyaltyTier === "standard"
    ? REFUND_POLICY.standardWindowDays
    : REFUND_POLICY.goldPlatinumWindowDays;
}

// ─── Tool factory ─────────────────────────────────────────────────────────────

/**
 * Build the six refund-agent tools bound to a specific session.
 *
 * @param {string} sessionId - Unique identifier for the agent session.
 * @returns {Record<string, import('ai').Tool>}
 */
export function buildTools(sessionId) {
  // ── a. getCustomerProfile ──────────────────────────────────────────────────
  const getCustomerProfile = tool({
    description:
      "Retrieve a customer's profile (name, email, loyalty tier, and order summary). " +
      "Always call this first before any other tool.",
    parameters: z.object({
      customerId: z
        .string()
        .describe("The unique customer id, e.g. 'cust-001'."),
    }),
    execute: withLogging(sessionId, "getCustomerProfile", async ({ customerId }) => {
      const customer = findCustomer(customerId);
      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        loyaltyTier: customer.loyaltyTier,
        orderSummary: customer.orders.map((o) => ({
          orderId: o.orderId,
          product: o.product,
          category: o.category,
          price: o.price,
          status: o.status,
          purchaseDate: o.purchaseDate,
        })),
      };
    }),
  });

  // ── b. getOrderDetails ────────────────────────────────────────────────────
  const getOrderDetails = tool({
    description:
      "Retrieve full details for a specific order, including condition and refund history. " +
      "Call this after getCustomerProfile and before checkRefundEligibility.",
    parameters: z.object({
      customerId: z.string().describe("The customer id."),
      orderId: z.string().describe("The order id to fetch details for."),
    }),
    execute: withLogging(sessionId, "getOrderDetails", async ({ customerId, orderId }) => {
      const customer = findCustomer(customerId);
      const order = findOrder(customer, orderId);
      return {
        ...order,
        orderAgeDays: orderAgeDays(order.purchaseDate),
        loyaltyTier: customer.loyaltyTier,
        allowedWindowDays: windowDays(customer.loyaltyTier),
      };
    }),
  });

  // ── c. checkRefundEligibility ─────────────────────────────────────────────
  const checkRefundEligibility = tool({
    description:
      "Run the full refund-eligibility rules engine for an order. " +
      "NEVER approve or deny a refund without calling this tool first. " +
      "Returns { eligible, reasonCode, clause, message, escalate, requiresHumanNote }.",
    parameters: z.object({
      customerId: z.string().describe("The customer id."),
      orderId: z.string().describe("The order id to evaluate."),
    }),
    execute: withLogging(
      sessionId,
      "checkRefundEligibility",
      async ({ customerId, orderId }) => {
        const customer = findCustomer(customerId);
        const order = findOrder(customer, orderId);
        const ageDays = orderAgeDays(order.purchaseDate);
        const isOverrideCondition = REFUND_POLICY.overrideConditions.includes(
          order.condition
        );
        const isNonRefundable = REFUND_POLICY.nonRefundableCategories.includes(
          order.category
        );
        const allowedWindow = windowDays(customer.loyaltyTier);

        // Count refunds from BOTH the refundStore (processed this session)
        // AND the historical refundHistory on the order records.
        const storeCount = refundStore.countInWindow(
          customerId,
          REFUND_POLICY.refundCapWindowDays
        );

        // Count refunds from existing refundHistory arrays across all orders
        const windowCutoff = new Date(TODAY);
        windowCutoff.setDate(
          windowCutoff.getDate() - REFUND_POLICY.refundCapWindowDays
        );
        const historicalCount = customer.orders.reduce((total, o) => {
          if (!o.refundHistory) return total;
          return (
            total +
            o.refundHistory.filter(
              (r) => new Date(r.refundDate).getTime() >= windowCutoff.getTime()
            ).length
          );
        }, 0);

        const totalRefundCount = storeCount + historicalCount;

        /** @type {{ eligible: boolean, reasonCode: string, clause: string, message: string, escalate: boolean, requiresHumanNote: boolean }} */
        let result;

        // ── Rule 1: Must be delivered ──────────────────────────────────────
        if (order.status !== "delivered") {
          result = {
            eligible: false,
            reasonCode: "not-delivered",
            clause: "General — order must be in 'delivered' status",
            message: `Order ${orderId} has status '${order.status}' and is not yet eligible for a refund.`,
            escalate: false,
            requiresHumanNote: false,
          };
        }
        // ── Rule 2: Defective / damaged override (check BEFORE category check) ──
        else if (isOverrideCondition) {
          result = {
            eligible: true,
            reasonCode: "defective-damaged-override",
            clause:
              "REFUND_POLICY §4 — Defective/Damaged Override: refundable regardless of return window; mandatory human review required.",
            message: `Order ${orderId} has condition '${order.condition}'. Approved under the defective/damaged override. A human agent must review and add a note before the refund is processed.`,
            escalate: false,
            requiresHumanNote: true,
          };
        }
        // ── Rule 3: Non-refundable category ──────────────────────────────────
        else if (isNonRefundable) {
          result = {
            eligible: false,
            reasonCode: "non-refundable-category",
            clause: `REFUND_POLICY §2 — Non-Refundable Categories: '${order.category}' items are not eligible for refunds.`,
            message: `Order ${orderId} is in the '${order.category}' category, which is non-refundable under our policy.`,
            escalate: false,
            requiresHumanNote: false,
          };
        }
        // ── Rule 4: Return window check ───────────────────────────────────────
        else if (ageDays > allowedWindow) {
          result = {
            eligible: false,
            reasonCode: "window-expired",
            clause: `REFUND_POLICY §1 — Return Windows: ${customer.loyaltyTier} tier allows ${allowedWindow} days; order is ${ageDays} days old.`,
            message: `Order ${orderId} is ${ageDays} days old, which exceeds the ${allowedWindow}-day return window for ${customer.loyaltyTier} customers.`,
            escalate: false,
            requiresHumanNote: false,
          };
        }
        // ── Rule 5: Refund cap / escalation ─────────────────────────────────
        else if (totalRefundCount >= REFUND_POLICY.refundCap) {
          result = {
            eligible: false,
            reasonCode: "refund-cap-exceeded",
            clause: `REFUND_POLICY §5 — Refund Cap: maximum ${REFUND_POLICY.refundCap} refunds per ${REFUND_POLICY.refundCapWindowDays}-day rolling window. Customer has ${totalRefundCount}.`,
            message: `Customer ${customerId} has already received ${totalRefundCount} refund(s) in the last ${REFUND_POLICY.refundCapWindowDays} days, exceeding the cap of ${REFUND_POLICY.refundCap}. This request must be escalated to a human agent.`,
            escalate: true,
            requiresHumanNote: false,
          };
        }
        // ── Eligible ──────────────────────────────────────────────────────────
        else {
          const hasRestockingFee =
            REFUND_POLICY.restockingFeeConditions.includes(order.condition);
          result = {
            eligible: true,
            reasonCode: "approved",
            clause: hasRestockingFee
              ? `REFUND_POLICY §1 + §3 — Within ${allowedWindow}-day window; condition '${order.condition}' incurs ${REFUND_POLICY.restockingFeePercent}% restocking fee.`
              : `REFUND_POLICY §1 — Within ${allowedWindow}-day return window; condition '${order.condition}' incurs no restocking fee.`,
            message: hasRestockingFee
              ? `Order ${orderId} is eligible for a refund with a ${REFUND_POLICY.restockingFeePercent}% restocking fee (condition: ${order.condition}).`
              : `Order ${orderId} is eligible for a full refund (condition: ${order.condition}, within return window).`,
            escalate: false,
            requiresHumanNote: false,
          };
        }

        // Publish decision or escalation event
        logBus.publish({
          sessionId,
          type: result.escalate ? "escalation" : "decision",
          label: result.escalate
            ? `Escalation: ${result.reasonCode}`
            : `Decision: ${result.reasonCode}`,
          detail: { customerId, orderId, ...result },
        });

        return result;
      }
    ),
  });

  // ── d. calculateRefundAmount ──────────────────────────────────────────────
  const calculateRefundAmount = tool({
    description:
      "Calculate the exact refund amount for an eligible order, applying the " +
      "restocking fee if the item is opened/used and NOT defective or damaged. " +
      "Only call this after checkRefundEligibility confirms eligible=true.",
    parameters: z.object({
      customerId: z.string().describe("The customer id."),
      orderId: z.string().describe("The order id."),
      isDefectiveOverride: z
        .boolean()
        .describe(
          "Pass true if checkRefundEligibility returned reasonCode 'defective-damaged-override'. " +
            "Skips the restocking fee."
        ),
    }),
    execute: withLogging(
      sessionId,
      "calculateRefundAmount",
      async ({ customerId, orderId, isDefectiveOverride }) => {
        const customer = findCustomer(customerId);
        const order = findOrder(customer, orderId);
        const price = order.price;

        const applyRestockingFee =
          !isDefectiveOverride &&
          REFUND_POLICY.restockingFeeConditions.includes(order.condition);

        const feeAmount = applyRestockingFee
          ? parseFloat(((price * REFUND_POLICY.restockingFeePercent) / 100).toFixed(2))
          : 0;

        const refundAmount = parseFloat((price - feeAmount).toFixed(2));

        return {
          originalPrice: price,
          restockingFeePercent: applyRestockingFee
            ? REFUND_POLICY.restockingFeePercent
            : 0,
          restockingFeeAmount: feeAmount,
          refundAmount,
          currency: "USD",
          clause: applyRestockingFee
            ? `REFUND_POLICY §3 — ${REFUND_POLICY.restockingFeePercent}% restocking fee applied (condition: ${order.condition}).`
            : "No restocking fee applicable.",
        };
      }
    ),
  });

  // ── e. processRefund ──────────────────────────────────────────────────────
  const processRefund = tool({
    description:
      "Write a confirmed refund record to the refund store. " +
      "Only call this after calculateRefundAmount, and only if checkRefundEligibility " +
      "confirmed eligible=true and escalate=false.",
    parameters: z.object({
      customerId: z.string().describe("The customer id."),
      orderId: z.string().describe("The order id."),
      amount: z
        .number()
        .describe("The final refund amount in USD (after any restocking fee)."),
      restockingFee: z
        .number()
        .describe("The restocking fee amount deducted (0 if none)."),
      reason: z.string().describe("Human-readable reason for the refund."),
      requiresHumanNote: z
        .boolean()
        .describe(
          "Set to true if checkRefundEligibility flagged requiresHumanNote " +
            "(defective/damaged override). A human must add a review note before " +
            "the financial transaction is actually executed."
        ),
    }),
    execute: withLogging(
      sessionId,
      "processRefund",
      async ({ customerId, orderId, amount, restockingFee, reason, requiresHumanNote }) => {
        const record = refundStore.process({
          customerId,
          orderId,
          amount,
          restockingFee,
          reason,
          requiresHumanNote,
        });
        return {
          success: true,
          refundRecord: record,
          message: requiresHumanNote
            ? `Refund of $${amount} recorded for order ${orderId}. ⚠️ A human agent must review and add a note before the payment is released.`
            : `Refund of $${amount} successfully processed for order ${orderId}.`,
        };
      }
    ),
  });

  // ── f. escalateToHuman ────────────────────────────────────────────────────
  const escalateToHuman = tool({
    description:
      "Escalate a refund request to a human agent. Call this when checkRefundEligibility " +
      "returns escalate=true, or when the case is genuinely ambiguous. " +
      "Does NOT process a refund — it only logs the escalation.",
    parameters: z.object({
      customerId: z.string().describe("The customer id."),
      orderId: z.string().describe("The order id being escalated."),
      reason: z
        .string()
        .describe("A clear explanation of why this case requires human review."),
    }),
    execute: withLogging(
      sessionId,
      "escalateToHuman",
      async ({ customerId, orderId, reason }) => {
        logBus.publish({
          sessionId,
          type: "escalation",
          label: `Escalated: ${orderId}`,
          detail: { customerId, orderId, reason },
        });

        return {
          escalated: true,
          customerId,
          orderId,
          reason,
          message: `Case for order ${orderId} has been escalated to a human agent. Reason: ${reason}`,
        };
      }
    ),
  });

  return {
    getCustomerProfile,
    getOrderDetails,
    checkRefundEligibility,
    calculateRefundAmount,
    processRefund,
    escalateToHuman,
  };
}
