/**
 * refundStore.js
 * --------------
 * In-memory refund record store singleton. Stashed on `globalThis.__ariaRefundStore`
 * to survive Next.js dev-mode hot-reloads.
 *
 * A refund record shape (plain JS object):
 * @typedef {Object} RefundRecord
 * @property {string} customerId
 * @property {string} orderId
 * @property {number} amount          - Final amount refunded (after any restocking fee)
 * @property {number} [restockingFee] - Fee amount deducted, if applicable
 * @property {string} reason          - Human-readable reason
 * @property {boolean} requiresHumanNote - Whether a human review note is needed
 * @property {string} processedAt     - ISO-8601 timestamp of when processRefund was called
 */

import { TODAY } from "@/lib/data/customers";

/** @returns {{ process: Function, all: Function, countInWindow: Function }} */
function createRefundStore() {
  /** @type {RefundRecord[]} */
  const records = [];

  /**
   * Append a new refund record.
   * Automatically stamps `processedAt` to the current ISO timestamp.
   *
   * @param {Omit<RefundRecord, 'processedAt'>} refund
   * @returns {RefundRecord} The stored record.
   */
  function process(refund) {
    const record = {
      ...refund,
      processedAt: new Date().toISOString(),
    };
    records.push(record);
    return record;
  }

  /**
   * Return a shallow copy of all stored refund records.
   * @returns {RefundRecord[]}
   */
  function all() {
    return [...records];
  }

  /**
   * Count how many refunds exist for a given customer within a rolling window
   * of `days` days before TODAY (the fixed demo date from customers.js).
   *
   * Using TODAY for determinism so demos behave consistently regardless of
   * the wall-clock date.
   *
   * @param {string} customerId
   * @param {number} days  - Rolling window size in calendar days
   * @returns {number}
   */
  function countInWindow(customerId, days) {
    const cutoff = new Date(TODAY);
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffTime = cutoff.getTime();

    return records.filter((r) => {
      if (r.customerId !== customerId) return false;
      const t = new Date(r.processedAt).getTime();
      return t >= cutoffTime;
    }).length;
  }

  return { process, all, countInWindow };
}

// ── Singleton: reuse across hot-reloads ───────────────────────────────────────
if (!globalThis.__ariaRefundStore) {
  globalThis.__ariaRefundStore = createRefundStore();
}

/** @type {ReturnType<typeof createRefundStore>} */
const refundStore = globalThis.__ariaRefundStore;

export default refundStore;
