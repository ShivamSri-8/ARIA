"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { customers } from "@/lib/data/customers";
import CustomerPicker from "@/components/CustomerPicker";
import CustomerCard from "@/components/CustomerCard";
import ChatPanel from "@/components/ChatPanel";
import VoiceButton from "@/components/VoiceButton";
import {
  MessageSquare,
  Receipt,
  Users,
  FileText,
  Brain,
  BarChart3,
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  LogOut,
  HelpCircle,
  Bot,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";

// ─── Sidebar nav items ────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: MessageSquare, label: "Live Chat",        active: true,  href: "/" },
  { icon: Receipt,       label: "Refund Requests",  active: false, href: "#" },
  { icon: Users,         label: "Customers",        active: false, href: "#" },
  { icon: FileText,      label: "Policy Documents", active: false, href: "#" },
  { icon: Brain,         label: "Reasoning Logs",   active: false, href: "/admin", badge: "Admin" },
  { icon: BarChart3,     label: "Analytics",        active: false, href: "#" },
  { icon: Settings,      label: "Settings",         active: false, href: "#" },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ onSelectCustomer }) {
  return (
    <aside
      style={{
        width: "260px",
        minWidth: "260px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Mesh background effect */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "var(--gradient-sidebar)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Content (above mesh) */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
        {/* ── Brand ── */}
        <div style={{ padding: "24px 20px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
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
              <Bot size={19} color="white" style={{ position: "relative" }} />
            </div>
            <div>
              <div
                className="gradient-text"
                style={{
                  fontSize: "var(--font-size-xl)",
                  fontWeight: "800",
                  fontFamily: "var(--font-sans)",
                  letterSpacing: "var(--letter-spacing-tight)",
                  lineHeight: "var(--line-height-tight)",
                }}
              >
                Aria
              </div>
              <div
                style={{
                  fontSize: "var(--font-size-xs)",
                  color: "var(--text-muted)",
                  marginTop: "3px",
                  fontWeight: "400",
                  letterSpacing: "var(--letter-spacing-wide)",
                  textTransform: "uppercase",
                }}
              >
                Refund Intelligence
              </div>
            </div>
          </div>
        </div>

        {/* ── Separator ── */}
        <div style={{ margin: "0 16px", height: "1px", background: "linear-gradient(90deg, transparent, var(--border-medium), transparent)" }} />

        {/* ── Customer Picker ── */}
        <div style={{ padding: "16px 16px 12px" }}>
          <div className="section-label" style={{ marginBottom: "10px", paddingLeft: "2px" }}>
            Active Customer
          </div>
          <CustomerPicker onSelect={onSelectCustomer} />
        </div>

        {/* ── Navigation ── */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "8px 10px 0" }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
            {NAV_ITEMS.map(({ icon: Icon, label, active, href, badge }) => (
              <li key={label}>
                <Link
                  href={href}
                  className={`nav-item${active ? " active" : ""}`}
                  style={{ display: "flex" }}
                >
                  <Icon size={16} style={{ flexShrink: 0, opacity: active ? 1 : 0.6 }} />
                  <span style={{ flex: 1, fontSize: "var(--font-size-sm)" }}>{label}</span>
                  {badge && (
                    <span className="badge badge-primary" style={{ fontSize: "9px", padding: "2px 8px" }}>
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {/* ── System Overview ── */}
          <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
                padding: "0 4px",
              }}
            >
              <span className="section-label">System Overview</span>
              <button
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  opacity: 0.35,
                  padding: "4px",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-secondary)",
                  transition: "all var(--transition-fast)",
                  display: "flex",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.35"; e.currentTarget.style.background = "none"; }}
                aria-label="Refresh stats"
              >
                <RefreshCw size={11} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <StatRow label="Total Requests" value="32" />
              <StatRow
                label="Approved"
                value="18"
                icon={<CheckCircle2 size={11} color="var(--green-text)" />}
                valueColor="var(--green-text)"
                accentLeft="var(--green)"
              />
              <StatRow
                label="Denied"
                value="9"
                icon={<XCircle size={11} color="var(--red-text)" />}
                valueColor="var(--red-text)"
                accentLeft="var(--red)"
              />
              <StatRow
                label="Pending"
                value="5"
                icon={<Clock size={11} color="var(--amber-text)" />}
                valueColor="var(--amber-text)"
                accentLeft="var(--amber)"
              />
            </div>

            {/* Success Rate */}
            <div
              style={{
                marginTop: "12px",
                padding: "14px 16px",
                borderRadius: "var(--radius-lg)",
                background: "linear-gradient(135deg, var(--primary-dim), rgba(6,182,212,0.04))",
                border: "1px solid var(--primary-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <TrendingUp size={14} color="var(--text-accent)" />
                <span style={{ fontSize: "var(--font-size-sm)", fontWeight: "500", color: "var(--text-accent)" }}>
                  Success Rate
                </span>
              </div>
              <span
                style={{
                  fontSize: "var(--font-size-xs)",
                  fontWeight: "700",
                  padding: "4px 12px",
                  borderRadius: "var(--radius-pill)",
                  background: "var(--gradient-primary)",
                  color: "white",
                  letterSpacing: "var(--letter-spacing-snug)",
                  boxShadow: "var(--shadow-glow)",
                }}
              >
                81.3%
              </span>
            </div>
          </div>
        </nav>

        {/* ── Footer ── */}
        <div
          style={{
            padding: "16px 14px 20px",
            borderTop: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
            <Link
              href="#"
              className="btn-ghost"
              style={{ flex: 1, justifyContent: "center", fontSize: "var(--font-size-xs)", padding: "7px 10px" }}
            >
              <HelpCircle size={12} />
              Support
            </Link>
            <Link
              href="#"
              className="btn-ghost"
              style={{ flex: 1, justifyContent: "center", fontSize: "var(--font-size-xs)", padding: "7px 10px" }}
            >
              <LogOut size={12} />
              Sign Out
            </Link>
          </div>

          {/* Admin profile */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 14px",
              borderRadius: "var(--radius-lg)",
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
              transition: "all var(--transition-fast)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--border-medium)";
              e.currentTarget.style.background = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.background = "var(--bg-subtle)";
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
                fontSize: "var(--font-size-sm)",
                fontWeight: "700",
                color: "white",
                flexShrink: 0,
                boxShadow: "var(--shadow-glow)",
              }}
            >
              A
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "var(--font-size-sm)",
                  fontWeight: "600",
                  color: "var(--text-primary)",
                  lineHeight: "var(--line-height-tight)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Admin
              </div>
              <div
                style={{
                  fontSize: "var(--font-size-2xs)",
                  color: "var(--text-muted)",
                  marginTop: "2px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontFamily: "var(--font-mono)",
                }}
              >
                admin@aria.ai
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── StatRow ──────────────────────────────────────────────────────────────────

function StatRow({ label, value, icon, valueColor, accentLeft }) {
  return (
    <div
      className="stat-row"
      style={{
        borderLeft: accentLeft ? `3px solid ${accentLeft}` : "1px solid var(--border)",
        paddingLeft: accentLeft ? "12px" : "14px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
        {icon}
        <span style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)", fontWeight: "400" }}>
          {label}
        </span>
      </div>
      <span
        style={{
          fontSize: "var(--font-size-base)",
          fontWeight: "700",
          color: valueColor || "var(--text-primary)",
          fontFamily: "var(--font-sans)",
          letterSpacing: "var(--letter-spacing-tight)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Top Header ───────────────────────────────────────────────────────────────

function TopHeader({ customerId, sessionId }) {
  return (
    <header
      className="glass-panel"
      style={{
        height: "60px",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        borderBottom: "1px solid var(--border)",
        borderTop: "none",
        borderLeft: "none",
        borderRight: "none",
        borderRadius: 0,
        zIndex: 10,
      }}
    >
      {/* Agent status */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "6px 16px",
          borderRadius: "var(--radius-pill)",
          background: "var(--green-dim)",
          border: "1px solid var(--green-border)",
        }}
      >
        <span
          className="pulse-online"
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: "var(--green)",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-secondary)", fontWeight: "400" }}>
          Agent
        </span>
        <span style={{ fontSize: "var(--font-size-xs)", fontWeight: "700", color: "var(--green-text)" }}>
          Online
        </span>
      </div>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {customerId && sessionId && (
          <VoiceButton customerId={customerId} sessionId={sessionId} />
        )}

        <Link
          href="/admin"
          className="btn-ghost"
          style={{ fontSize: "var(--font-size-xs)", gap: "6px" }}
        >
          <Zap size={12} />
          Admin Panel
        </Link>

        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            background: "var(--gradient-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "var(--font-size-sm)",
            fontWeight: "700",
            color: "white",
            cursor: "pointer",
            boxShadow: "var(--shadow-glow)",
            transition: "all var(--transition-base)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", inset: 0, background: "var(--gradient-shine)", borderRadius: "inherit" }} />
          <span style={{ position: "relative" }}>A</span>
        </div>
      </div>
    </header>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  const features = [
    { icon: <MessageSquare size={20} color="var(--text-accent)" />, label: "AI Chat",         desc: "Natural language refund conversations" },
    { icon: <Brain size={20} color="var(--accent-text)" />,         label: "Live Reasoning",  desc: "Watch the agent think in real time" },
    { icon: <Sparkles size={20} color="var(--text-accent)" />,      label: "Voice Mode",      desc: "Hands-free WebRTC voice interface" },
  ];

  return (
    <div
      className="mesh-bg"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "40px",
        padding: "60px 40px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated orb */}
      <div style={{ position: "relative" }} className="animate-scale-in">
        <div
          className="empty-orb"
          style={{
            width: "110px",
            height: "110px",
            borderRadius: "50%",
            background: "radial-gradient(circle at 30% 30%, rgba(124,58,237,0.2), rgba(6,182,212,0.08), transparent 70%)",
            border: "1px solid var(--primary-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            boxShadow: "0 0 60px rgba(124,58,237,0.12), inset 0 0 30px rgba(124,58,237,0.05)",
          }}
        >
          {/* Animated ring 1 */}
          <div
            className="empty-orb-ring"
            style={{
              position: "absolute",
              inset: "-16px",
              borderRadius: "50%",
              border: "1px solid rgba(124,58,237,0.15)",
            }}
          />
          {/* Animated ring 2 */}
          <div
            className="empty-orb-ring"
            style={{
              position: "absolute",
              inset: "-32px",
              borderRadius: "50%",
              border: "1px solid rgba(124,58,237,0.08)",
              animationDelay: "0.8s",
            }}
          />
          {/* Animated ring 3 */}
          <div
            className="empty-orb-ring"
            style={{
              position: "absolute",
              inset: "-48px",
              borderRadius: "50%",
              border: "1px solid rgba(6,182,212,0.05)",
              animationDelay: "1.6s",
            }}
          />
          <Bot size={44} color="var(--text-accent)" style={{ filter: "drop-shadow(0 0 8px rgba(124,58,237,0.3))" }} />
          {/* AI badge */}
          <div
            style={{
              position: "absolute",
              bottom: "2px",
              right: "2px",
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #059669, #22c55e)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "9px",
              fontWeight: "800",
              color: "white",
              border: "3px solid var(--bg-base)",
              fontFamily: "var(--font-sans)",
              boxShadow: "0 0 12px rgba(34,197,94,0.3)",
            }}
          >
            AI
          </div>
        </div>
      </div>

      {/* Copy */}
      <div style={{ maxWidth: "420px" }} className="animate-fade-in-up" >
        <h1
          className="gradient-text"
          style={{
            fontSize: "var(--font-size-3xl)",
            fontWeight: "800",
            marginBottom: "12px",
            fontFamily: "var(--font-sans)",
            letterSpacing: "var(--letter-spacing-tight)",
            lineHeight: "var(--line-height-tight)",
          }}
        >
          Select a customer to begin
        </h1>
        <p style={{
          fontSize: "var(--font-size-md)",
          color: "var(--text-secondary)",
          lineHeight: "var(--line-height-relaxed)",
          maxWidth: "360px",
          margin: "0 auto",
        }}>
          Choose a customer from the sidebar dropdown to view their profile and start a refund conversation with Aria.
        </p>
      </div>

      {/* Feature cards */}
      <div
        style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center", maxWidth: "600px" }}
      >
        {features.map(({ icon, label, desc }, i) => (
          <div
            key={label}
            className="animate-fade-in-up"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "14px",
              padding: "28px 20px",
              borderRadius: "var(--radius-2xl)",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid var(--border)",
              flex: "1 1 160px",
              minWidth: "160px",
              maxWidth: "200px",
              textAlign: "center",
              animationDelay: `${0.15 + i * 0.1}s`,
              transition: "all var(--transition-base)",
              cursor: "default",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--primary-border)";
              e.currentTarget.style.background = "var(--primary-dim)";
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "var(--shadow-lg), var(--shadow-glow)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.background = "rgba(255,255,255,0.02)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "var(--radius-lg)",
                background: "var(--primary-dim)",
                border: "1px solid var(--primary-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "inset 0 0 20px rgba(124,58,237,0.05)",
              }}
            >
              {icon}
            </div>
            <div>
              <div style={{
                fontSize: "var(--font-size-base)",
                fontWeight: "700",
                color: "var(--text-primary)",
                marginBottom: "6px",
                fontFamily: "var(--font-sans)",
                letterSpacing: "var(--letter-spacing-snug)",
              }}>
                {label}
              </div>
              <div style={{
                fontSize: "var(--font-size-xs)",
                color: "var(--text-muted)",
                lineHeight: "var(--line-height-snug)",
              }}>
                {desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [customerId, setCustomerId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [initialMessage, setInitialMessage] = useState(null);

  const handleSelectCustomer = useCallback((id) => {
    setCustomerId(id);
    setSessionId(crypto.randomUUID());
    setInitialMessage(null);
  }, []);

  const handleStartChat = useCallback((orderId, product) => {
    setSessionId(crypto.randomUUID());
    setInitialMessage(
      `I'd like to request a refund for my order ${orderId} (${product}).`
    );
  }, []);

  const selectedCustomer = customerId
    ? customers.find((c) => c.id === customerId) ?? null
    : null;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg-base)",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Sidebar */}
      <Sidebar onSelectCustomer={handleSelectCustomer} />

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        {/* Header */}
        <TopHeader customerId={customerId} sessionId={sessionId} />

        {/* Body */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", background: "var(--bg-base)" }}>
          {customerId && sessionId ? (
            <>
              {/* Customer sidebar */}
              <aside
                style={{
                  width: "300px",
                  minWidth: "300px",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  background: "var(--bg-surface)",
                  borderRight: "1px solid var(--border)",
                }}
                className="animate-slide-left"
              >
                {selectedCustomer && (
                  <CustomerCard
                    customer={selectedCustomer}
                    onStartChat={handleStartChat}
                  />
                )}
              </aside>

              {/* Chat */}
              <main style={{ flex: 1, overflow: "hidden" }}>
                <ChatPanel
                  key={sessionId}
                  customerId={customerId}
                  sessionId={sessionId}
                  initialMessage={initialMessage}
                />
              </main>
            </>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}
