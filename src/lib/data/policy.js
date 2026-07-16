/**
 * Refund policy constants for the Aria customer-service engine.
 *
 * Keep this file in sync with POLICY.md at the repository root.
 */

export const REFUND_POLICY = {
  // ─── Return Windows ────────────────────────────────────────────────────────

  /**
   * Number of days from purchase date within which Standard-tier customers
   * may request a refund.
   */
  standardWindowDays: 30,

  /**
   * Number of days from purchase date within which Gold and Platinum customers
   * may request a refund.
   */
  goldPlatinumWindowDays: 45,

  // ─── Non-Refundable Categories ─────────────────────────────────────────────

  /**
   * Orders in these categories are never eligible for a refund, regardless
   * of condition, loyalty tier, or how recently they were purchased.
   */
  nonRefundableCategories: ["digital", "final-sale"],

  // ─── Defective / Damaged Override ──────────────────────────────────────────

  /**
   * Conditions that override the return window restriction.
   * An order in one of these states is refundable even if the standard window
   * has closed, but the transaction is flagged for mandatory human review.
   */
  overrideConditions: ["defective", "damaged-in-transit"],

  /**
   * When an overrideCondition is matched, set this flag on the result so
   * downstream agents / UIs know to prompt a human review note.
   */
  requiresHumanNote: true,

  // ─── Restocking Fee ────────────────────────────────────────────────────────

  /**
   * Percentage deducted from the refund amount when an item was opened or used
   * (condition: "opened-unused" | "used") AND it is NOT defective or damaged.
   * Applied on top of the base refund amount before processing.
   *
   * @example  price = 100, restockingFeePercent = 10  →  refund = 90
   */
  restockingFeePercent: 10,

  /**
   * Conditions that incur the restocking fee (when not defective/damaged).
   */
  restockingFeeConditions: ["opened-unused", "used"],

  // ─── Refund-Cap & Escalation ───────────────────────────────────────────────

  /**
   * Maximum number of successful refunds a customer may receive within the
   * rolling window defined by `refundCapWindowDays` before subsequent requests
   * are escalated to a human agent instead of being auto-processed.
   */
  refundCap: 2,

  /**
   * Rolling lookback window (in days) used to count a customer's recent
   * refunds against `refundCap`.
   */
  refundCapWindowDays: 90,

  /**
   * When a customer has reached or exceeded `refundCap` within the rolling
   * window, the refund request is escalated rather than auto-approved or
   * auto-denied.  This action label is surfaced in the decision result.
   */
  escalationAction: "escalate-to-human",
};
