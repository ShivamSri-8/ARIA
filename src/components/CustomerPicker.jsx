"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

const TIER_BADGE = {
  standard: "Standard",
  gold:     "Gold ✦",
  platinum: "Platinum ✦✦",
};

export default function CustomerPicker({ onSelect }) {
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected]   = useState("");
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleChange(e) {
    const id = e.target.value;
    setSelected(id);
    if (id) onSelect(id);
  }

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {loading && (
        <Loader2
          size={12}
          color="var(--text-muted)"
          style={{
            position:      "absolute",
            left:          "12px",
            top:           "50%",
            transform:     "translateY(-50%)",
            zIndex:        1,
            pointerEvents: "none",
            animation:     "spin 1s linear infinite",
          }}
        />
      )}

      <select
        id="customer-picker"
        value={selected}
        onChange={handleChange}
        disabled={loading}
        style={{
          width:               "100%",
          appearance:          "none",
          WebkitAppearance:    "none",
          padding:             "9px 34px 9px 12px",
          fontSize:            "var(--font-size-sm)",
          fontWeight:          "500",
          fontFamily:          "var(--font-body)",
          color:               selected ? "var(--text-primary)" : "var(--text-muted)",
          background:          "var(--bg-subtle)",
          border:              "1px solid var(--border-medium)",
          borderRadius:        "var(--radius-md)",
          cursor:              loading ? "wait" : "pointer",
          outline:             "none",
          opacity:             loading ? 0.6 : 1,
          transition:          "all var(--transition-fast)",
          lineHeight:          "var(--line-height-normal)",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "var(--primary)";
          e.target.style.boxShadow   = "0 0 0 3px var(--primary-glow)";
          e.target.style.background  = "var(--primary-dim)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "var(--border-medium)";
          e.target.style.boxShadow   = "none";
          e.target.style.background  = "var(--bg-subtle)";
        }}
      >
        <option value="" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
          {loading ? "Loading customers…" : "Select a customer…"}
        </option>
        {customers.map((c) => (
          <option
            key={c.id}
            value={c.id}
            style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}
          >
            {c.name} · {TIER_BADGE[c.loyaltyTier] ?? c.loyaltyTier}
          </option>
        ))}
      </select>

      <ChevronDown
        size={13}
        color="var(--text-muted)"
        style={{
          position:      "absolute",
          right:         "10px",
          top:           "50%",
          transform:     "translateY(-50%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
