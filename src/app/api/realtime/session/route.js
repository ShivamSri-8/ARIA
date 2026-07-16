/**
 * POST /api/realtime/session
 * ──────────────────────────
 * Mints a short-lived OpenAI Realtime API ephemeral session token and returns
 * it to the client. OPENAI_API_KEY is used server-side only — it is NEVER
 * forwarded to the browser.
 *
 * The ephemeral token is scoped to a single WebRTC session and expires
 * automatically after ~60 seconds (OpenAI's limit). The client uses it to
 * open a WebRTC connection directly to the Realtime API.
 *
 * Tools are declared as raw JSON-schema "function" objects that mirror the
 * Zod schemas in tools.js — the Realtime API does not accept Zod objects.
 *
 * Response: the raw ephemeral session JSON returned by OpenAI, which includes:
 *   { id, object, model, voice, instructions, tools, client_secret: { value, expires_at }, ... }
 */

export const dynamic = "force-dynamic";

import { buildSystemPrompt } from "@/lib/agent/prompt";

/** Raw JSON-schema mirrors of the six Zod schemas defined in tools.js. */
const REALTIME_TOOLS = [
  // ── a. getCustomerProfile ────────────────────────────────────────────────
  {
    type: "function",
    name: "getCustomerProfile",
    description:
      "Retrieve a customer's profile (name, email, loyalty tier, and order summary). " +
      "Always call this first before any other tool.",
    parameters: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "The unique customer id, e.g. 'cust-001'.",
        },
      },
      required: ["customerId"],
    },
  },

  // ── b. getOrderDetails ───────────────────────────────────────────────────
  {
    type: "function",
    name: "getOrderDetails",
    description:
      "Retrieve full details for a specific order, including condition and refund history. " +
      "Call this after getCustomerProfile and before checkRefundEligibility.",
    parameters: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "The customer id.",
        },
        orderId: {
          type: "string",
          description: "The order id to fetch details for.",
        },
      },
      required: ["customerId", "orderId"],
    },
  },

  // ── c. checkRefundEligibility ────────────────────────────────────────────
  {
    type: "function",
    name: "checkRefundEligibility",
    description:
      "Run the full refund-eligibility rules engine for an order. " +
      "NEVER approve or deny a refund without calling this tool first. " +
      "Returns { eligible, reasonCode, clause, message, escalate, requiresHumanNote }.",
    parameters: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "The customer id.",
        },
        orderId: {
          type: "string",
          description: "The order id to evaluate.",
        },
      },
      required: ["customerId", "orderId"],
    },
  },

  // ── d. calculateRefundAmount ─────────────────────────────────────────────
  {
    type: "function",
    name: "calculateRefundAmount",
    description:
      "Calculate the exact refund amount for an eligible order, applying the " +
      "restocking fee if the item is opened/used and NOT defective or damaged. " +
      "Only call this after checkRefundEligibility confirms eligible=true.",
    parameters: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "The customer id.",
        },
        orderId: {
          type: "string",
          description: "The order id.",
        },
        isDefectiveOverride: {
          type: "boolean",
          description:
            "Pass true if checkRefundEligibility returned reasonCode 'defective-damaged-override'. " +
            "Skips the restocking fee.",
        },
      },
      required: ["customerId", "orderId", "isDefectiveOverride"],
    },
  },

  // ── e. processRefund ─────────────────────────────────────────────────────
  {
    type: "function",
    name: "processRefund",
    description:
      "Write a confirmed refund record to the refund store. " +
      "Only call this after calculateRefundAmount, and only if checkRefundEligibility " +
      "confirmed eligible=true and escalate=false.",
    parameters: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "The customer id.",
        },
        orderId: {
          type: "string",
          description: "The order id.",
        },
        amount: {
          type: "number",
          description:
            "The final refund amount in USD (after any restocking fee).",
        },
        restockingFee: {
          type: "number",
          description: "The restocking fee amount deducted (0 if none).",
        },
        reason: {
          type: "string",
          description: "Human-readable reason for the refund.",
        },
        requiresHumanNote: {
          type: "boolean",
          description:
            "Set to true if checkRefundEligibility flagged requiresHumanNote " +
            "(defective/damaged override). A human must add a review note before " +
            "the financial transaction is actually executed.",
        },
      },
      required: [
        "customerId",
        "orderId",
        "amount",
        "restockingFee",
        "reason",
        "requiresHumanNote",
      ],
    },
  },

  // ── f. escalateToHuman ───────────────────────────────────────────────────
  {
    type: "function",
    name: "escalateToHuman",
    description:
      "Escalate a refund request to a human agent. Call this when checkRefundEligibility " +
      "returns escalate=true, or when the case is genuinely ambiguous. " +
      "Does NOT process a refund — it only logs the escalation.",
    parameters: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "The customer id.",
        },
        orderId: {
          type: "string",
          description: "The order id being escalated.",
        },
        reason: {
          type: "string",
          description:
            "A clear explanation of why this case requires human review.",
        },
      },
      required: ["customerId", "orderId", "reason"],
    },
  },
];

export async function POST(request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  let customerId = "unknown";
  try {
    const body = await request.json();
    if (body?.customerId) {
      customerId = body.customerId;
    }
  } catch (err) {
    // Body might be empty
  }

  try {
    const openAiResponse = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview",
          voice: "verse",
          instructions: buildSystemPrompt(customerId),
          tools: REALTIME_TOOLS,
          // Tool choice: auto — the model decides when to call tools
          tool_choice: "auto",
        }),
      }
    );

    if (!openAiResponse.ok) {
      const errText = await openAiResponse.text();
      console.error("[Realtime API Error] OpenAI request failed:", {
        status: openAiResponse.status,
        statusText: openAiResponse.statusText,
        body: errText,
      });
      return Response.json(
        {
          error: "OpenAI Realtime session creation failed.",
          detail: errText,
        },
        { status: openAiResponse.status }
      );
    }

    const sessionData = await openAiResponse.json();

    // Return the full ephemeral session payload to the client.
    // The payload includes client_secret.value — a scoped, expiring token
    // that the browser uses to open its WebRTC peer connection. The master
    // OPENAI_API_KEY is never sent to the client.
    return Response.json(sessionData);
  } catch (err) {
    console.error("[Realtime API Error] Exception caught:", err);
    return Response.json(
      { error: err?.message ?? "Failed to create Realtime session." },
      { status: 500 }
    );
  }
}
