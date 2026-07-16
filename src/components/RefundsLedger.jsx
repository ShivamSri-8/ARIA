"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, RefreshCw, Inbox, DollarSign, TrendingUp, Clock } from "lucide-react";

const POLL_INTERVAL_MS = 3500;

export default function RefundsLedger() {
  const [refunds,     setRefunds]     = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/refunds");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setRefunds(data);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        setError(err.message ?? "Failed to load");
      }
    }
    load();
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const sorted      = [...refunds].reverse();
  const totalAmount = sorted.reduce((sum, r) => sum + (r.amount ?? 0), 0);

  return (
    <div
      style={{
        display:       "flex",
        flexDirection: "column",
        height:        "100%",
        background:    "var(--bg-base)",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          flexShrink:   0,
          padding:      "20px 24px",
          background:   "var(--bg-surface)",
          borderBottom: "1px solid var(--border)",
          position:     "relative",
          overflow:     "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(34,197,94,0.05), transparent)", pointerEvents: "none" }} />

        {/* Title row */}
        <div
          style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            marginBottom:   "20px",
            position:       "relative",
            zIndex:         1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <DollarSign size={16} color="var(--green-text)" />
            <span
              style={{
                fontSize:     "var(--font-size-md)",
                fontWeight:   "700",
                color:        "var(--text-primary)",
                fontFamily:   "var(--font-sans)",
                letterSpacing:"var(--letter-spacing-tight)",
              }}
            >
              Refunds Ledger
            </span>
          </div>
          <span
            className="badge badge-primary"
            style={{ fontFamily: "var(--font-mono)", fontSize: "10px", padding: "4px 10px" }}
          >
            {refunds.length} records
          </span>
        </div>

        {/* Total amount card */}
        <div
          style={{
            padding:      "20px",
            borderRadius: "var(--radius-xl)",
            background:   "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))",
            border:       "1px solid var(--green-border)",
            display:      "flex",
            alignItems:   "center",
            justifyContent:"space-between",
            position:     "relative",
            zIndex:       1,
            boxShadow:    "0 4px 20px rgba(34,197,94,0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
            <span
              style={{
                fontSize:     "var(--font-size-3xl)",
                fontWeight:   "800",
                color:        "var(--green-text)",
                lineHeight:   1,
                fontFamily:   "var(--font-sans)",
                letterSpacing:"var(--letter-spacing-tight)",
                textShadow:   "0 2px 10px rgba(34,197,94,0.2)",
              }}
            >
              ${totalAmount.toFixed(2)}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <TrendingUp size={14} color="var(--green-text)" />
              <span style={{ fontSize: "var(--font-size-sm)", color: "var(--green-text)", fontWeight: "600" }}>total</span>
            </div>
          </div>
          <div
            style={{
              display:    "flex",
              alignItems: "center",
              gap:        "6px",
              fontSize:   "var(--font-size-xs)",
              color:      "rgba(255,255,255,0.6)",
              fontFamily: "var(--font-mono)",
              background: "rgba(0,0,0,0.2)",
              padding:    "6px 12px",
              borderRadius:"var(--radius-pill)",
            }}
          >
            <RefreshCw size={11} />
            {lastUpdated ? lastUpdated.toLocaleTimeString() : "Loading…"}
          </div>
        </div>

        {error && (
          <p
            style={{
              marginTop: "12px",
              fontSize:  "var(--font-size-sm)",
              color:     "var(--red-text)",
              display:   "flex",
              alignItems:"center",
              gap:       "6px",
              fontWeight:"500",
              position:  "relative",
              zIndex:    1,
            }}
          >
            <AlertTriangle size={14} />
            Error: {error}
          </p>
        )}
      </div>

      {/* ── List ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", background: "var(--gradient-sidebar)" }}>
        {sorted.length === 0 ? (
          <div
            className="animate-fade-in"
            style={{
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "center",
              justifyContent: "center",
              height:         "100%",
              gap:            "16px",
              color:          "var(--text-muted)",
            }}
          >
            <div
              style={{
                width:        "60px",
                height:       "60px",
                borderRadius: "50%",
                background:   "var(--bg-subtle)",
                border:       "1px solid var(--border)",
                display:      "flex",
                alignItems:   "center",
                justifyContent:"center",
                boxShadow:    "inset 0 2px 10px rgba(0,0,0,0.1)",
              }}
            >
              <Inbox size={26} color="var(--text-muted)" />
            </div>
            <p style={{ fontSize: "var(--font-size-base)", fontWeight: "500" }}>No refunds processed yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {sorted.map((r, i) => (
              <RefundCard key={`${r.customerId}-${r.orderId}-${i}`} refund={r} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RefundCard({ refund: r, index }) {
  return (
    <div
      className="refund-card card"
      style={{ animationDelay: `${Math.min(index * 0.05, 0.25)}s` }}
    >
      {/* Amount + badge */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
        <div>
          <p
            style={{
              fontSize:     "var(--font-size-2xl)",
              fontWeight:   "800",
              color:        "var(--green-text)",
              lineHeight:   1,
              fontFamily:   "var(--font-sans)",
              letterSpacing:"var(--letter-spacing-tight)",
            }}
          >
            ${r.amount.toFixed(2)}
          </p>
          <p
            style={{
              fontSize:   "var(--font-size-xs)",
              marginTop:  "6px",
              color:      "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {r.orderId}
          </p>
        </div>
        {r.requiresHumanNote && (
          <span className="badge badge-amber" style={{ gap: "6px", fontSize: "10px", padding: "4px 10px" }}>
            <AlertTriangle size={11} />
            Review
          </span>
        )}
      </div>

      {/* Key/value details */}
      <div
        style={{
          display:       "flex",
          flexDirection: "column",
          gap:           "8px",
          fontSize:      "var(--font-size-sm)",
          paddingTop:    "8px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "var(--text-muted)" }}>Customer</span>
          <span style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: "var(--font-size-xs)" }}>
            {r.customerId}
          </span>
        </div>
        {r.restockingFee > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>Restocking fee</span>
            <span style={{ color: "var(--red-text)", fontWeight: "700" }}>−${r.restockingFee.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "var(--text-muted)" }}>Processed</span>
          <div
            style={{
              display:    "flex",
              alignItems: "center",
              gap:        "6px",
              color:      "var(--text-secondary)",
              fontFamily: "var(--font-mono)",
              fontSize:   "var(--font-size-xs)",
            }}
          >
            <Clock size={11} />
            {new Date(r.processedAt).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Reason */}
      {r.reason && (
        <p
          style={{
            fontSize:    "var(--font-size-sm)",
            fontStyle:   "italic",
            lineHeight:  "var(--line-height-relaxed)",
            color:       "var(--text-secondary)",
            paddingTop:  "12px",
            borderTop:   "1px solid var(--border)",
            marginTop:   "4px",
          }}
        >
          &ldquo;{r.reason}&rdquo;
        </p>
      )}
    </div>
  );
}
