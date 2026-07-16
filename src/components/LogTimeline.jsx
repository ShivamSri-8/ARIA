"use client";

import { useState, useEffect, useRef } from "react";
import { Wifi, WifiOff, RotateCcw, Activity, Filter } from "lucide-react";

const MAX_EVENTS = 300;

const TYPE_CONFIG = {
  tool_call: {
    dot:   "#f59e0b",
    badge: { bg: "var(--amber-dim)", border: "var(--amber-border)", color: "var(--amber-text)" },
    card:  { bg: "rgba(245,158,11,0.05)",  border: "rgba(245,158,11,0.2)",  left: "#f59e0b" },
  },
  tool_result: {
    dot:   "var(--green)",
    badge: { bg: "var(--green-dim)", border: "var(--green-border)", color: "var(--green-text)" },
    card:  { bg: "rgba(34,197,94,0.05)",  border: "rgba(34,197,94,0.2)",  left: "var(--green)" },
  },
  tool_error: {
    dot:   "var(--red)",
    badge: { bg: "var(--red-dim)", border: "var(--red-border)", color: "var(--red-text)" },
    card:  { bg: "rgba(239,68,68,0.05)",   border: "rgba(239,68,68,0.25)",   left: "var(--red)" },
  },
  decision: {
    dot:   "var(--primary)",
    badge: { bg: "var(--primary-dim)", border: "var(--primary-border)", color: "var(--text-accent)" },
    card:  { bg: "rgba(124,58,237,0.05)",  border: "rgba(124,58,237,0.2)", left: "var(--primary)" },
  },
  escalation: {
    dot:   "#f97316",
    badge: { bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.3)", color: "#fb923c" },
    card:  { bg: "rgba(249,115,22,0.05)", border: "rgba(249,115,22,0.2)", left: "#f97316" },
  },
  agent_message: {
    dot:   "var(--accent)",
    badge: { bg: "var(--accent-dim)", border: "var(--accent-border)", color: "var(--accent-text)" },
    card:  { bg: "rgba(255,255,255,0.02)", border: "var(--border)",         left: "rgba(6,182,212,0.5)" },
  },
  user_message: {
    dot:   "rgba(255,255,255,0.3)",
    badge: { bg: "rgba(255,255,255,0.06)", border: "var(--border-medium)", color: "var(--text-secondary)" },
    card:  { bg: "rgba(255,255,255,0.02)", border: "var(--border)",         left: "rgba(255,255,255,0.15)" },
  },
  session_start: {
    dot:   "rgba(124,58,237,0.5)",
    badge: { bg: "var(--primary-dim)", border: "var(--primary-border)", color: "var(--text-accent)" },
    card:  { bg: "rgba(255,255,255,0.02)", border: "var(--border)",         left: "rgba(124,58,237,0.3)" },
  },
};

const FALLBACK = {
  dot:   "rgba(148,163,184,0.4)",
  badge: { bg: "rgba(255,255,255,0.04)", border: "var(--border)", color: "var(--text-muted)" },
  card:  { bg: "rgba(255,255,255,0.02)", border: "var(--border)", left: "rgba(148,163,184,0.2)" },
};

export default function LogTimeline() {
  const [events,        setEvents]        = useState([]);
  const [streamStatus,  setStreamStatus]  = useState("connecting");
  const [sessionFilter, setSessionFilter] = useState("all");
  const endRef              = useRef(null);
  const wasEverConnected    = useRef(false);

  useEffect(() => {
    const es = new EventSource("/api/logs/stream");
    es.onopen    = () => { wasEverConnected.current = true; setStreamStatus("live"); };
    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        setEvents((prev) => {
          const next = [...prev, event];
          return next.length > MAX_EVENTS ? next.slice(next.length - MAX_EVENTS) : next;
        });
      } catch {}
    };
    es.onerror = () => setStreamStatus(wasEverConnected.current ? "disconnected" : "connecting");
    return () => { es.close(); setStreamStatus("disconnected"); };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  const sessionIds = [...new Set(events.map((e) => e.sessionId))].filter(Boolean);
  const displayed  = sessionFilter === "all" ? events : events.filter((e) => e.sessionId === sessionFilter);
  const isLive     = streamStatus === "live";
  const isDisconnected = streamStatus === "disconnected";

  return (
    <div
      style={{
        display:       "flex",
        flexDirection: "column",
        height:        "100%",
        background:    "var(--bg-base)",
        position:      "relative",
      }}
    >
      {/* ── Toolbar ── */}
      <div
        className="glass-panel"
        style={{
          flexShrink:   0,
          display:      "flex",
          alignItems:   "center",
          justifyContent:"space-between",
          gap:          "16px",
          padding:      "16px 24px",
          borderBottom: "1px solid var(--border)",
          borderTop:    "none",
          borderLeft:   "none",
          borderRight:  "none",
          borderRadius: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Activity size={16} color="var(--text-accent)" />
            <span
              style={{
                fontSize:     "var(--font-size-md)",
                fontWeight:   "700",
                color:        "var(--text-primary)",
                fontFamily:   "var(--font-sans)",
                letterSpacing:"var(--letter-spacing-snug)",
              }}
            >
              Log Timeline
            </span>
          </div>

          {/* Stream status */}
          {isLive ? (
            <span className="badge badge-green" style={{ gap: "6px", padding: "4px 10px" }}>
              <Wifi size={12} /> Live
            </span>
          ) : isDisconnected ? (
            <span className="badge badge-red" style={{ gap: "6px", padding: "4px 10px" }}>
              <WifiOff size={12} /> Disconnected
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "var(--font-size-xs)", color: "var(--text-muted)", fontWeight: "500" }}>
              <RotateCcw size={12} style={{ animation: "spin 1s linear infinite" }} />
              Connecting…
            </span>
          )}

          <span
            style={{
              fontSize:   "var(--font-size-xs)",
              color:      "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {displayed.length} event{displayed.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Session filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Filter size={14} color="var(--text-muted)" />
          <select
            id="session-filter"
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            style={{
              padding:    "6px 32px 6px 12px",
              fontSize:   "var(--font-size-sm)",
              fontFamily: "var(--font-body)",
              fontWeight: "500",
              color:      "var(--text-secondary)",
              cursor:     "pointer",
              background: "var(--bg-subtle)",
              border:     "1px solid var(--border-medium)",
              borderRadius:"var(--radius-pill)",
              appearance: "none",
              outline:    "none",
              transition: "all var(--transition-base)",
            }}
          >
            <option value="all">All sessions</option>
            {sessionIds.map((id) => (
              <option key={id} value={id}>
                {id.slice(0, 8)}…
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Disconnected banner ── */}
      {isDisconnected && (
        <div
          className="animate-slide-down"
          style={{
            flexShrink:   0,
            padding:      "12px 24px",
            fontSize:     "var(--font-size-sm)",
            fontWeight:   "500",
            background:   "var(--red-dim)",
            borderBottom: "1px solid var(--red-border)",
            color:        "var(--red-text)",
            display:      "flex",
            alignItems:   "center",
            gap:          "8px",
          }}
        >
          <WifiOff size={14} />
          Stream disconnected — showing cached events. Refresh to reconnect.
        </div>
      )}

      {/* ── Event list ── */}
      <div
        style={{
          flex:      1,
          overflowY: "auto",
          padding:   "24px 24px 24px 28px",
          display:   "flex",
          flexDirection: "column",
          gap:       "10px",
          background: "var(--gradient-sidebar)",
        }}
      >
        {displayed.length === 0 && (
          <div
            className="animate-fade-in"
            style={{
              display:         "flex",
              flexDirection:   "column",
              alignItems:      "center",
              justifyContent:  "center",
              height:          "100%",
              gap:             "16px",
              color:           "var(--text-muted)",
              fontSize:        "var(--font-size-base)",
              fontWeight:      "500",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "var(--primary-dim)",
                border: "1px solid var(--primary-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "inset 0 0 20px rgba(124,58,237,0.05)",
              }}
            >
              <Activity size={26} color="var(--primary-strong)" />
            </div>
            {isLive
              ? "Waiting for events…"
              : isDisconnected
                ? "No events captured."
                : "Connecting to stream…"
            }
          </div>
        )}

        {displayed.map((event, idx) => {
          const cfg = TYPE_CONFIG[event.type] ?? FALLBACK;

          return (
            <div key={event.id ?? idx} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              {/* Timeline dot + line */}
              <div
                style={{
                  display:       "flex",
                  flexDirection: "column",
                  alignItems:    "center",
                  paddingTop:    "8px",
                  flexShrink:    0,
                }}
              >
                <div
                  style={{
                    width:        "10px",
                    height:       "10px",
                    borderRadius: "50%",
                    background:   cfg.dot,
                    boxShadow:    `0 0 12px ${cfg.dot}`,
                    flexShrink:   0,
                  }}
                />
                {idx < displayed.length - 1 && (
                  <div
                    style={{
                      width:     "2px",
                      flex:      1,
                      minHeight: "24px",
                      background:"linear-gradient(to bottom, rgba(255,255,255,0.08), transparent)",
                      marginTop: "4px",
                    }}
                  />
                )}
              </div>

              {/* Card */}
              <div
                className="timeline-card"
                style={{
                  background:  cfg.card.bg,
                  border:      `1px solid ${cfg.card.border}`,
                  borderLeft:  `4px solid ${cfg.card.left}`,
                  marginBottom:"4px",
                }}
              >
                {/* Header row */}
                <div
                  style={{
                    display:     "flex",
                    alignItems:  "center",
                    gap:         "10px",
                    flexWrap:    "wrap",
                    marginBottom:event.detail ? "12px" : 0,
                  }}
                >
                  <span
                    style={{
                      fontSize:      "10px",
                      fontWeight:    "800",
                      padding:       "3px 10px",
                      borderRadius:  "var(--radius-pill)",
                      background:    cfg.badge.bg,
                      border:        `1px solid ${cfg.badge.border}`,
                      color:         cfg.badge.color,
                      textTransform: "uppercase",
                      letterSpacing: "var(--letter-spacing-wide)",
                      fontFamily:    "var(--font-mono)",
                      flexShrink:    0,
                    }}
                  >
                    {event.type}
                  </span>
                  <span
                    style={{
                      fontSize:    "var(--font-size-base)",
                      fontWeight:  "600",
                      color:       "var(--text-primary)",
                      flex:        1,
                      minWidth:    0,
                      overflow:    "hidden",
                      textOverflow:"ellipsis",
                      whiteSpace:  "nowrap",
                      letterSpacing:"var(--letter-spacing-snug)",
                    }}
                  >
                    {event.label}
                  </span>
                  <div
                    style={{
                      display:    "flex",
                      alignItems: "center",
                      gap:        "10px",
                      marginLeft: "auto",
                      flexShrink: 0,
                    }}
                  >
                    {event.durationMs != null && (
                      <span
                        style={{
                          fontSize:   "11px",
                          color:      "var(--text-secondary)",
                          fontFamily: "var(--font-mono)",
                          background: "var(--bg-subtle)",
                          padding:    "2px 8px",
                          borderRadius:"var(--radius-sm)",
                          border:     "1px solid var(--border)",
                          fontWeight: "500",
                        }}
                      >
                        {event.durationMs}ms
                      </span>
                    )}
                    <span
                      style={{
                        fontSize:   "11px",
                        color:      "var(--text-muted)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Payload */}
                {event.detail != null && (
                  <pre
                    style={{
                      padding:      "12px 16px",
                      borderRadius: "var(--radius-md)",
                      fontSize:     "var(--font-size-xs)",
                      lineHeight:   "var(--line-height-relaxed)",
                      overflowX:    "auto",
                      whiteSpace:   "pre-wrap",
                      wordBreak:    "break-all",
                      background:   "rgba(0,0,0,0.4)",
                      border:       "1px solid var(--border-medium)",
                      color:        "var(--text-secondary)",
                      fontFamily:   "var(--font-mono)",
                      margin:       0,
                      boxShadow:    "inset 0 2px 10px rgba(0,0,0,0.2)",
                    }}
                  >
                    {JSON.stringify(event.detail, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          );
        })}

        <div ref={endRef} />
      </div>
    </div>
  );
}
