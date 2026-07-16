"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";
import {
  Send,
  Loader2,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  Paperclip,
  Bot,
  User,
  Clock,
} from "lucide-react";

// ─── Tool helpers ─────────────────────────────────────────────────────────────

const TOOL_LABELS = {
  getCustomerProfile:    "Fetching profile",
  getOrderDetails:       "Loading order",
  checkRefundEligibility:"Checking eligibility",
  calculateRefundAmount: "Calculating refund",
  processRefund:         "Processing refund",
  escalateToHuman:       "Escalating to agent",
};

function isNegativeResult(result) {
  if (!result) return false;
  if (result.eligible === false) return true;
  if (result.error != null) return true;
  return false;
}

function ToolBadge({ invocation }) {
  const label     = TOOL_LABELS[invocation.toolName] ?? invocation.toolName;
  const isPending = invocation.state === "call" || invocation.state === "partial-call";
  const isResult  = invocation.state === "result";
  const negative  = isResult && isNegativeResult(invocation.result);

  let cls = "tool-badge tool-badge-pending";
  if (isResult && negative)  cls = "tool-badge tool-badge-error";
  if (isResult && !negative) cls = "tool-badge tool-badge-success";

  return (
    <span className={cls}>
      {isPending
        ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
        : negative
          ? <X size={10} style={{ flexShrink: 0 }} />
          : <Check size={10} style={{ flexShrink: 0 }} />
      }
      {label}
    </span>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message, index }) {
  const isUser = message.role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "20px",
        gap: "12px",
        alignItems: "flex-end",
        animationDelay: `${Math.min(index * 0.04, 0.2)}s`,
      }}
      className="animate-fade-in-up"
    >
      {/* AI Avatar */}
      {!isUser && (
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            background: "var(--gradient-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "var(--shadow-glow)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", inset: 0, background: "var(--gradient-shine)", borderRadius: "inherit" }} />
          <Bot size={15} color="white" style={{ position: "relative" }} />
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          maxWidth: "70%",
          alignItems: isUser ? "flex-end" : "flex-start",
        }}
      >
        {/* Tool badges */}
        {!isUser && message.toolInvocations?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", paddingLeft: "2px" }}>
            {message.toolInvocations.map((inv) => (
              <ToolBadge key={inv.toolCallId} invocation={inv} />
            ))}
          </div>
        )}

        {/* Bubble */}
        {message.content && (
          <div className={isUser ? "bubble-user" : "bubble-ai"}>
            {message.content}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.1))",
            border: "1px solid var(--primary-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <User size={14} color="var(--text-accent)" />
        </div>
      )}
    </div>
  );
}

// ─── Suggested prompts ────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  { text: "I'd like to request a refund for one of my orders.",         icon: "📦" },
  { text: "Can you check if my recent order is eligible for a return?",  icon: "🔍" },
  { text: "My item arrived damaged — can I get a refund?",              icon: "⚠️" },
  { text: "What is your refund policy for my tier?",                    icon: "📋" },
];

function SuggestedPrompts({ onSelect }) {
  return (
    <div
      className="mesh-bg"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: "36px",
        padding: "60px 32px",
        textAlign: "center",
      }}
    >
      {/* Icon */}
      <div
        className="animate-scale-in"
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "radial-gradient(circle at 30% 30%, rgba(124,58,237,0.2), rgba(6,182,212,0.05), transparent 70%)",
          border: "1px solid var(--primary-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 48px rgba(124,58,237,0.1)",
          position: "relative",
        }}
      >
        <div
          className="empty-orb-ring"
          style={{
            position: "absolute",
            inset: "-12px",
            borderRadius: "50%",
            border: "1px solid rgba(124,58,237,0.12)",
          }}
        />
        <Sparkles size={32} color="var(--text-accent)" style={{ filter: "drop-shadow(0 0 6px rgba(124,58,237,0.3))" }} />
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <h2
          className="gradient-text"
          style={{
            fontSize: "var(--font-size-2xl)",
            fontWeight: "800",
            marginBottom: "10px",
            fontFamily: "var(--font-sans)",
            letterSpacing: "var(--letter-spacing-tight)",
          }}
        >
          How can I help you today?
        </h2>
        <p style={{
          fontSize: "var(--font-size-base)",
          color: "var(--text-secondary)",
          lineHeight: "var(--line-height-relaxed)",
        }}>
          Ask about a refund, or pick a prompt below.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", width: "100%", maxWidth: "520px" }}>
        {SUGGESTED_PROMPTS.map(({ text, icon }, i) => (
          <button
            key={text}
            onClick={() => onSelect(text)}
            className="prompt-btn animate-fade-in-up"
            style={{ animationDelay: `${0.2 + i * 0.08}s` }}
          >
            <span style={{ fontSize: "20px", flexShrink: 0, lineHeight: 1 }}>{icon}</span>
            <span style={{ lineHeight: "var(--line-height-snug)" }}>{text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main ChatPanel ───────────────────────────────────────────────────────────

export default function ChatPanel({ customerId, sessionId, initialMessage }) {
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const didAutoSubmit  = useRef(false);

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    append,
  } = useChat({
    api:  "/api/chat",
    body: { customerId, sessionId },
  });

  useEffect(() => {
    if (initialMessage && !didAutoSubmit.current && messages.length === 0) {
      didAutoSubmit.current = true;
      append({ role: "user", content: initialMessage });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function handleSuggestedPrompt(prompt) {
    setInput(prompt);
    inputRef.current?.focus();
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-base)",
      }}
    >
      {/* ── Chat Header ── */}
      <div
        className="glass-panel"
        style={{
          flexShrink: 0,
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          borderBottom: "1px solid var(--border)",
          borderTop: "none",
          borderLeft: "none",
          borderRight: "none",
          borderRadius: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <h2
            style={{
              fontSize: "var(--font-size-md)",
              fontWeight: "700",
              color: "var(--text-primary)",
              fontFamily: "var(--font-sans)",
              letterSpacing: "var(--letter-spacing-tight)",
            }}
          >
            Customer Chat
          </h2>
          <span className="badge badge-green" style={{ gap: "5px" }}>
            <span
              className="pulse-live"
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--green)",
                flexShrink: 0,
                display: "inline-block",
              }}
            />
            Live
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              fontSize: "var(--font-size-2xs)",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              padding: "4px 10px",
              borderRadius: "var(--radius-pill)",
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
            }}
          >
            {sessionId.slice(0, 8)}…
          </span>
          <button className="btn-danger">
            <X size={10} />
            End
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "28px 28px 12px",
        }}
      >
        {messages.length === 0 ? (
          <SuggestedPrompts onSelect={handleSuggestedPrompt} />
        ) : (
          <>
            {/* Date divider */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "32px", gap: "16px" }}>
              <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, var(--border-medium), transparent)" }} />
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 14px",
                  borderRadius: "var(--radius-pill)",
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border)",
                  fontSize: "var(--font-size-2xs)",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-body)",
                  fontWeight: "500",
                  whiteSpace: "nowrap",
                }}
              >
                <Clock size={10} />
                Today
              </span>
              <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, var(--border-medium), transparent)" }} />
            </div>

            {messages.map((message, idx) => (
              <MessageBubble key={message.id} message={message} index={idx} />
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div
                className="animate-fade-in"
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  marginBottom: "20px",
                  gap: "12px",
                  alignItems: "flex-end",
                }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: "var(--gradient-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "var(--shadow-glow)",
                    animation: "glow-pulse 2s ease-in-out infinite",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ position: "absolute", inset: 0, background: "var(--gradient-shine)", borderRadius: "inherit" }} />
                  <Bot size={15} color="white" style={{ position: "relative" }} />
                </div>
                <div
                  style={{
                    padding: "14px 20px",
                    borderRadius: "var(--radius-2xl) var(--radius-2xl) var(--radius-2xl) var(--radius-sm)",
                    background: "linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                    border: "1px solid var(--border-medium)",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                  }}
                >
                  <span style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)", fontStyle: "italic" }}>
                    Aria is thinking
                  </span>
                  <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="typing-dot"
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "var(--primary)",
                          animationDelay: `${delay}ms`,
                          display: "inline-block",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div
          className="animate-slide-down"
          style={{
            flexShrink: 0,
            margin: "0 24px 12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderRadius: "var(--radius-lg)",
            background: "var(--red-dim)",
            border: "1px solid var(--red-border)",
            color: "var(--red-text)",
            fontSize: "var(--font-size-sm)",
          }}
        >
          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
          {error.message ?? "Something went wrong. Please try again."}
        </div>
      )}

      {/* ── Input bar ── */}
      <form
        onSubmit={handleSubmit}
        style={{
          flexShrink: 0,
          padding: "16px 24px 24px",
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "6px 6px 6px 20px",
            borderRadius: "var(--radius-2xl)",
            background: "var(--bg-subtle)",
            border: "1px solid var(--border-medium)",
            transition: "all var(--transition-base)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = "var(--primary)";
            e.currentTarget.style.boxShadow = "0 0 0 4px var(--primary-glow), 0 2px 12px rgba(0,0,0,0.1)";
            e.currentTarget.style.background = "rgba(124,58,237,0.04)";
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = "var(--border-medium)";
            e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.1)";
            e.currentTarget.style.background = "var(--bg-subtle)";
          }}
        >
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              display: "flex",
              cursor: "pointer",
              flexShrink: 0,
              color: "var(--text-muted)",
              transition: "all var(--transition-fast)",
              padding: "4px",
              borderRadius: "var(--radius-sm)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
            aria-label="Attach file"
          >
            <Paperclip size={16} />
          </button>

          <input
            id="chat-input"
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message or ask about a refund…"
            disabled={isLoading}
            autoComplete="off"
            style={{
              flex: 1,
              height: "40px",
              fontSize: "var(--font-size-base)",
              fontFamily: "var(--font-body)",
              color: "var(--text-primary)",
              background: "transparent",
              border: "none",
              outline: "none",
              opacity: isLoading ? 0.5 : 1,
              transition: "opacity var(--transition-fast)",
            }}
          />

          <button
            id="chat-send-btn"
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: isLoading || !input.trim()
                ? "rgba(124,58,237,0.08)"
                : "var(--gradient-primary)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
              flexShrink: 0,
              transition: "all var(--transition-base)",
              color: "white",
              boxShadow: isLoading || !input.trim() ? "none" : "var(--shadow-glow)",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              if (!isLoading && input.trim()) {
                e.currentTarget.style.transform = "scale(1.08)";
                e.currentTarget.style.boxShadow = "var(--shadow-glow-strong)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = input.trim() && !isLoading ? "var(--shadow-glow)" : "none";
            }}
          >
            {!isLoading && !(!input.trim()) && (
              <div style={{ position: "absolute", inset: 0, background: "var(--gradient-shine)", borderRadius: "inherit" }} />
            )}
            {isLoading
              ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite", position: "relative" }} />
              : <Send size={15} style={{ marginLeft: "1px", position: "relative" }} />
            }
          </button>
        </div>
      </form>
    </div>
  );
}
