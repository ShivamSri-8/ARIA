/**
 * logBus.js
 * ---------
 * In-memory log bus singleton. Stashed on `globalThis.__ariaLogBus` so it
 * survives Next.js dev-mode hot-reloads without being recreated.
 *
 * Event shape (all fields are plain JS values — no TypeScript):
 * @typedef {Object} LogEvent
 * @property {string}  id          - Unique event id (auto-generated if omitted)
 * @property {string}  timestamp   - ISO-8601 timestamp (auto-generated if omitted)
 * @property {string}  sessionId   - The agent session this event belongs to
 * @property {string}  type        - One of: session_start | user_message | tool_call |
 *                                   tool_result | tool_error | agent_message |
 *                                   decision | escalation
 * @property {string}  label       - Short human-readable label for the event
 * @property {*}       [detail]    - Arbitrary extra data (args, results, etc.)
 * @property {number}  [durationMs]- Wall-clock ms the operation took (tool calls)
 */

import { EventEmitter } from "events";

/** Maximum number of events kept in the in-memory history ring. */
const HISTORY_CAP = 500;

/** @returns {EventEmitter & { publish: Function, getHistory: Function }} */
function createLogBus() {
  const emitter = new EventEmitter();
  emitter.setMaxListeners(50); // generous limit for multiple SSE subscribers

  /** @type {LogEvent[]} */
  const history = [];

  let _seq = 0;

  /**
   * Publish a log event.
   * Missing `id` and `timestamp` fields are auto-filled before storing.
   *
   * @param {Partial<LogEvent>} event
   * @returns {LogEvent} The fully-populated event that was stored and emitted.
   */
  emitter.publish = function publish(event) {
    /** @type {LogEvent} */
    const full = {
      id: event.id ?? `evt-${Date.now()}-${++_seq}`,
      timestamp: event.timestamp ?? new Date().toISOString(),
      sessionId: event.sessionId ?? "unknown",
      type: event.type ?? "agent_message",
      label: event.label ?? "",
      detail: event.detail ?? null,
      durationMs: event.durationMs ?? undefined,
    };

    // Push and enforce cap (drop oldest when over limit)
    history.push(full);
    if (history.length > HISTORY_CAP) {
      history.splice(0, history.length - HISTORY_CAP);
    }

    emitter.emit("log", full);
    return full;
  };

  /**
   * Return a shallow copy of the current history array.
   * @returns {LogEvent[]}
   */
  emitter.getHistory = function getHistory() {
    return [...history];
  };

  return emitter;
}

// ── Singleton pattern: reuse existing instance across hot-reloads ─────────────
if (!globalThis.__ariaLogBus) {
  globalThis.__ariaLogBus = createLogBus();
}

/** @type {ReturnType<typeof createLogBus>} */
const logBus = globalThis.__ariaLogBus;

export default logBus;
