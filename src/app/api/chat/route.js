/**
 * POST /api/chat
 * ──────────────
 * Body: { messages, customerId, sessionId }
 * Streams an AI response using the Aria refund agent.
 */

import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { buildTools } from "@/lib/agent/tools";
import { buildSystemPrompt } from "@/lib/agent/prompt";
import { customers } from "@/lib/data/customers";
import logBus from "@/lib/agent/logBus";

// Use Groq's OpenAI-compatible API endpoint
const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request) {
  let sessionId = "unknown";

  try {
    const body = await request.json();
    const { messages, customerId } = body;
    sessionId = body.sessionId ?? `session-${Date.now()}`;

    // 404-style JSON error if customer doesn't exist
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) {
      return Response.json(
        { error: `Customer not found: ${customerId}` },
        { status: 404 }
      );
    }

    // Publish log event for the latest user message
    const latestUser = [...messages].reverse().find((m) => m.role === "user");
    if (latestUser) {
      logBus.publish({
        sessionId,
        type: "user_message",
        label: "User message",
        detail: {
          customerId,
          content:
            typeof latestUser.content === "string"
              ? latestUser.content.slice(0, 300)
              : "[structured content]",
        },
      });
    }

    const result = await streamText({
      model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
      system: buildSystemPrompt(customerId),
      messages,
      tools: buildTools(sessionId),
      maxSteps: 6,
      onStepFinish: ({ text, toolCalls, finishReason }) => {
        if (text?.trim()) {
          logBus.publish({
            sessionId,
            type: "agent_message",
            label: "Agent step",
            detail: {
              text: text.slice(0, 300),
              toolCallCount: toolCalls?.length ?? 0,
              finishReason,
            },
          });
        }
      },
      onFinish: ({ finishReason, usage }) => {
        logBus.publish({
          sessionId,
          type: "agent_message",
          label: "Turn complete",
          detail: { finishReason, usage },
        });
      },
      onError: ({ error }) => {
        console.error("[Chat API Error] streamText onError:", error);
      },
    });

    return result.toDataStreamResponse();
  } catch (err) {
    console.error("[Chat API Error] Exception caught:", err);
    
    logBus.publish({
      sessionId,
      type: "tool_error",
      label: "chat-route-error",
      detail: { error: err?.message ?? String(err) },
    });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
