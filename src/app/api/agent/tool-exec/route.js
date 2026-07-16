/**
 * POST /api/agent/tool-exec
 * ─────────────────────────
 * Executes a single named tool from the Aria refund agent and returns the
 * result as JSON. This lets the voice pipeline (WebRTC / Realtime API) reuse
 * the exact same policy logic and logBus instrumentation as the text agent
 * without duplicating any rules.
 *
 * Request body: { sessionId: string, toolName: string, args: object }
 *
 * Responses:
 *   200  { result }                     – tool executed successfully
 *   400  { error }                      – missing / invalid fields
 *   404  { error }                      – unknown toolName
 *   500  { error }                      – tool threw during execution
 */

import { buildTools } from "@/lib/agent/tools";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { sessionId, toolName, args } = body ?? {};

  // ── Validate required fields ────────────────────────────────────────────────
  if (!sessionId || typeof sessionId !== "string") {
    return Response.json(
      { error: "Missing or invalid field: sessionId (string required)." },
      { status: 400 }
    );
  }
  if (!toolName || typeof toolName !== "string") {
    return Response.json(
      { error: "Missing or invalid field: toolName (string required)." },
      { status: 400 }
    );
  }
  if (args == null || typeof args !== "object" || Array.isArray(args)) {
    return Response.json(
      { error: "Missing or invalid field: args (object required)." },
      { status: 400 }
    );
  }

  // ── Resolve tool ────────────────────────────────────────────────────────────
  const tools = buildTools(sessionId);
  const resolvedTool = tools[toolName];

  if (!resolvedTool) {
    return Response.json(
      {
        error: `Unknown tool: "${toolName}". Valid names: ${Object.keys(tools).join(", ")}.`,
      },
      { status: 404 }
    );
  }

  if (typeof resolvedTool.execute !== "function") {
    return Response.json(
      { error: `Tool "${toolName}" has no execute function.` },
      { status: 500 }
    );
  }

  // ── Execute ─────────────────────────────────────────────────────────────────
  try {
    // Second argument is the ToolExecutionOptions object (empty here — the
    // logBus instrumentation is handled inside the withLogging wrapper in tools.js).
    const result = await resolvedTool.execute(args, {});
    return Response.json({ result });
  } catch (err) {
    return Response.json(
      { error: err?.message ?? "Tool execution failed." },
      { status: 500 }
    );
  }
}
