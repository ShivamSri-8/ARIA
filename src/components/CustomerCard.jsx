"use client";

import { Package, Calendar, Tag, AlertCircle, ArrowRight } from "lucide-react";

// ─── Tier config ──────────────────────────────────────────────────────────────

const TIER_CONFIG = {
  standard: {
    bg:     "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.1)",
    color:  "var(--text-secondary)",
    label:  "Standard",
    dot:    "#9ca3af",
  },
  gold: {
    bg:     "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.2)",
    color:  "var(--amber-text)",
    label:  "Gold ✦",
    dot:    "#f59e0b",
  },
  platinum: {
    bg:     "linear-gradient(135deg, var(--primary-dim), rgba(6,182,212,0.05))",
    border: "var(--primary-border)",
    color:  "var(--text-accent)",
    label:  "Platinum ✦✦",
    dot:    "var(--primary)",
  },
};

const CATEGORY_STYLE = {
  electronics:  { bg: "var(--blue-dim)",  border: "var(--blue-border)",  color: "var(--blue-text)" },
  clothing:     { bg: "var(--primary-dim)",border: "var(--primary-border)", color: "var(--text-accent)" },
  digital:      { bg: "var(--red-dim)",   border: "var(--red-border)",   color: "var(--red-text)" },
  "final-sale": { bg: "var(--red-dim)",   border: "var(--red-border)",   color: "var(--red-text)" },
  "home-goods": { bg: "rgba(6,182,212,0.1)", border: "rgba(6,182,212,0.2)", color: "var(--accent-text)" },
};

const FALLBACK_CAT = {
  bg: "rgba(255,255,255,0.04)",
  border: "var(--border)",
  color: "var(--text-secondary)",
};

const CONDITION_COLOR = {
  unopened:            "var(--green-text)",
  "opened-unused":     "var(--amber-text)",
  used:                "#f59e0b",
  defective:           "var(--red-text)",
  "damaged-in-transit":"var(--red-text)",
};

const STATUS_CONFIG = {
  delivered:  { color: "var(--green-text)", label: "Delivered" },
  shipped:    { color: "var(--blue-text)",  label: "Shipped"   },
  processing: { color: "var(--amber-text)", label: "Processing" },
  cancelled:  { color: "var(--text-muted)", label: "Cancelled" },
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
    year:  "numeric",
  });
}

// ─── OrderRow ─────────────────────────────────────────────────────────────────

function OrderRow({ order, onStartChat }) {
  const isNonRefundable = order.category === "digital" || order.category === "final-sale";
  const catStyle  = CATEGORY_STYLE[order.category] ?? FALLBACK_CAT;
  const statusCfg = STATUS_CONFIG[order.status] ?? { color: "var(--text-muted)", label: order.status };
  const condColor = CONDITION_COLOR[order.condition] ?? "var(--text-secondary)";

  return (
    <div className="order-card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Product + category */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: "var(--font-size-md)",
              fontWeight: "700",
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginBottom: "4px",
              fontFamily: "var(--font-sans)",
              letterSpacing: "var(--letter-spacing-snug)",
            }}
          >
            {order.product}
          </p>
          <p
            style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {order.orderId}
          </p>
        </div>
        <span
          style={{
            fontSize: "10px",
            fontWeight: "700",
            padding: "3px 10px",
            borderRadius: "var(--radius-pill)",
            background: catStyle.bg,
            border: `1px solid ${catStyle.border}`,
            color: catStyle.color,
            flexShrink: 0,
            textTransform: "uppercase",
            letterSpacing: "var(--letter-spacing-wide)",
          }}
        >
          {order.category}
        </span>
      </div>

      {/* Details grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px 12px",
          fontSize: "var(--font-size-xs)",
          color: "var(--text-secondary)",
          padding: "8px 0",
          borderTop: "1px solid var(--border)",
          borderBottom: isNonRefundable || order.refundHistory?.length > 0 ? "1px solid var(--border)" : "none",
        }}
      >
        {/* Price */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Tag size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>
            ${order.price.toFixed(2)}
          </span>
        </div>
        {/* Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: statusCfg.color,
              flexShrink: 0,
              boxShadow: `0 0 8px ${statusCfg.color}`,
            }}
          />
          <span style={{ color: statusCfg.color, fontWeight: "600" }}>{statusCfg.label}</span>
        </div>
        {/* Date */}
        <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", gap: "6px" }}>
          <Calendar size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <span style={{ color: "var(--text-secondary)" }}>
            {formatDate(order.purchaseDate)}
            {order.deliveryDate && (
              <span style={{ color: "var(--text-muted)" }}>
                {" "}· Del. {formatDate(order.deliveryDate)}
              </span>
            )}
          </span>
        </div>
        {/* Condition */}
        <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", gap: "6px" }}>
          <Package size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: "600", color: condColor, textTransform: "capitalize" }}>
            {order.condition}
          </span>
        </div>
      </div>

      {/* Non-refundable warning */}
      {isNonRefundable && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            borderRadius: "var(--radius-md)",
            background: "var(--red-dim)",
            border: "1px solid var(--red-border)",
            fontSize: "var(--font-size-xs)",
            color: "var(--red-text)",
            fontWeight: "500",
          }}
        >
          <AlertCircle size={12} style={{ flexShrink: 0 }} />
          Non-refundable ({order.category})
        </div>
      )}

      {order.refundHistory?.length > 0 && (
        <p style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>
          {order.refundHistory.length} prior refund{order.refundHistory.length > 1 ? "s" : ""}
        </p>
      )}

      {/* CTA */}
      <button
        onClick={() => onStartChat(order.orderId, order.product)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          padding: "10px 16px",
          borderRadius: "var(--radius-md)",
          background: "var(--primary-dim)",
          border: "1px solid var(--primary-border)",
          color: "var(--text-accent)",
          fontSize: "var(--font-size-sm)",
          fontWeight: "600",
          cursor: "pointer",
          transition: "all var(--transition-base)",
          fontFamily: "var(--font-body)",
          letterSpacing: "var(--letter-spacing-snug)",
          marginTop: "4px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--primary)";
          e.currentTarget.style.color = "white";
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "var(--shadow-md), var(--shadow-glow)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--primary-dim)";
          e.currentTarget.style.color = "var(--text-accent)";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        Ask about this order
        <ArrowRight size={14} />
      </button>
    </div>
  );
}

// ─── CustomerCard ─────────────────────────────────────────────────────────────

export default function CustomerCard({ customer, onStartChat }) {
  const tierCfg = TIER_CONFIG[customer.loyaltyTier] ?? TIER_CONFIG.standard;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      {/* Profile header */}
      <div
        style={{
          flexShrink: 0,
          padding: "24px 20px 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-surface)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "var(--gradient-hero)", pointerEvents: "none", opacity: 0.5 }} />

        {/* Avatar + name */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px", position: "relative", zIndex: 1 }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "var(--gradient-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "var(--font-size-xl)",
              fontWeight: "700",
              color: "white",
              flexShrink: 0,
              boxShadow: "var(--shadow-glow)",
              fontFamily: "var(--font-sans)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "var(--gradient-shine)",
                borderRadius: "inherit",
              }}
            />
            <span style={{ position: "relative" }}>
              {customer.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: "var(--font-size-lg)",
                fontWeight: "800",
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginBottom: "4px",
                fontFamily: "var(--font-sans)",
                letterSpacing: "var(--letter-spacing-tight)",
              }}
            >
              {customer.name}
            </p>
            <p
              style={{
                fontSize: "var(--font-size-xs)",
                color: "var(--text-muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: "var(--font-mono)",
              }}
            >
              {customer.email}
            </p>
          </div>
        </div>

        {/* Tier + ID row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", position: "relative", zIndex: 1 }}>
          <span
            style={{
              fontSize: "var(--font-size-xs)",
              fontWeight: "700",
              padding: "5px 12px",
              borderRadius: "var(--radius-pill)",
              background: tierCfg.bg,
              border: `1px solid ${tierCfg.border}`,
              color: tierCfg.color,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              letterSpacing: "var(--letter-spacing-wide)",
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: tierCfg.dot,
                display: "inline-block",
                flexShrink: 0,
                boxShadow: `0 0 6px ${tierCfg.dot}`,
              }}
            />
            {tierCfg.label}
          </span>
          <span
            style={{
              fontSize: "var(--font-size-2xs)",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              background: "var(--bg-subtle)",
              padding: "4px 8px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
            }}
          >
            {customer.id}
          </span>
        </div>
      </div>

      {/* Order list */}
      <div
        style={{
          flex: 1,
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          overflowY: "auto",
        }}
      >
        <p className="section-label" style={{ marginBottom: "4px", paddingLeft: "4px" }}>
          Orders ({customer.orders.length})
        </p>
        {customer.orders.map((order) => (
          <OrderRow
            key={order.orderId}
            order={order}
            onStartChat={onStartChat}
          />
        ))}
      </div>
    </div>
  );
}
