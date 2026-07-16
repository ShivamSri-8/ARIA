"use client";

import Link from "next/link";
import LogTimeline from "@/components/LogTimeline";
import RefundsLedger from "@/components/RefundsLedger";
import { ArrowLeft, Shield, Sparkles, Activity, DollarSign } from "lucide-react";

export default function AdminPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--bg-base)",
        overflow: "hidden",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* ── Admin Header ── */}
      <header
        className="glass-panel"
        style={{
          flexShrink: 0,
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          borderBottom: "1px solid var(--border)",
          borderTop: "none",
          borderLeft: "none",
          borderRight: "none",
          borderRadius: 0,
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "var(--gradient-hero)", pointerEvents: "none", opacity: 0.5 }} />

        {/* Left: Back button + Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", position: "relative", zIndex: 1 }}>
          <Link
            href="/"
            className="btn-ghost"
            style={{ fontSize: "var(--font-size-sm)", padding: "8px 14px" }}
          >
            <ArrowLeft size={16} />
            Back to Chat
          </Link>
          
          <div style={{ width: "1px", height: "24px", background: "var(--border-medium)" }} />

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-lg)",
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
              <Sparkles size={18} color="white" style={{ position: "relative" }} />
            </div>
            <div>
              <div
                className="gradient-text"
                style={{
                  fontSize: "var(--font-size-lg)",
                  fontWeight: "800",
                  fontFamily: "var(--font-sans)",
                  letterSpacing: "var(--letter-spacing-tight)",
                  lineHeight: "var(--line-height-tight)",
                }}
              >
                Aria
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                <Shield size={10} color="var(--text-muted)" />
                <span
                  style={{
                    fontSize: "10px",
                    color: "var(--text-secondary)",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "var(--letter-spacing-wider)",
                  }}
                >
                  Admin Dashboard
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Two-Pane Layout ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        
        {/* Left Pane: Log Timeline */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid var(--border)",
            minWidth: "500px",
            background: "var(--bg-surface)",
            position: "relative",
          }}
        >
          <div
            className="section-label"
            style={{
              padding: "12px 24px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(255,255,255,0.01)",
            }}
          >
            <Activity size={12} color="var(--primary)" />
            Agent Reasoning Logs
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <LogTimeline />
          </div>
        </div>

        {/* Right Pane: Refunds Ledger */}
        <div
          style={{
            width: "360px",
            minWidth: "360px",
            display: "flex",
            flexDirection: "column",
            background: "var(--bg-base)",
            position: "relative",
          }}
        >
          <div
            className="section-label"
            style={{
              padding: "12px 24px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(34,197,94,0.02)",
            }}
          >
            <DollarSign size={12} color="var(--green)" />
            Processed Refunds
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <RefundsLedger />
          </div>
        </div>

      </div>
    </div>
  );
}
