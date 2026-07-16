/**
 * GET /api/logs/stream
 * ────────────────────
 * Server-Sent Events endpoint.
 *
 * On connect:
 *   1. Replays the full in-memory logBus history as individual SSE messages.
 *   2. Subscribes to future "log" events and forwards them as they arrive.
 *   3. Sends a heartbeat comment every 15 s to prevent idle-timeout disconnects.
 *
 * Cleanup:
 *   The "log" listener and heartbeat interval are removed when the client
 *   disconnects (detected via the request's AbortSignal).
 */

export const dynamic = "force-dynamic";

import logBus from "@/lib/agent/logBus";

export async function GET(request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      /** Serialise one log event as an SSE "data:" frame. */
      function send(event) {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          // Controller may already be closed; ignore write errors.
        }
      }

      /** Send a keep-alive comment so proxies don't close the connection. */
      function heartbeat() {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          // Ignore if already closed.
        }
      }

      // ── 1. Replay existing history ──────────────────────────────────────
      for (const event of logBus.getHistory()) {
        send(event);
      }

      // ── 2. Subscribe to new events ──────────────────────────────────────
      logBus.on("log", send);

      // ── 3. Heartbeat every 15 s ─────────────────────────────────────────
      const heartbeatInterval = setInterval(heartbeat, 15_000);

      // ── 4. Cleanup on client disconnect ─────────────────────────────────
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval);
        logBus.off("log", send);
        try {
          controller.close();
        } catch {
          // Already closed — safe to ignore.
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
