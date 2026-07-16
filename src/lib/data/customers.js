/**
 * Mock customer data — 15 profiles covering every refund-policy branch.
 *
 * Branch coverage map
 * ────────────────────────────────────────────────────────────────────────────
 * CLEAN APPROVAL (in window, refundable category, no issues):
 *   cust-001 order ORD-001  – standard tier, 10 days old, electronics, unopened
 *   cust-002 order ORD-003  – gold tier, 20 days old, clothing, unopened
 *   cust-004 order ORD-007  – platinum tier, 40 days old, home-goods, unopened
 *   cust-006 order ORD-011  – standard tier, 28 days old, clothing, used (restocking fee applies)
 *
 * EXPIRED WINDOW DENIAL:
 *   cust-003 order ORD-005  – standard tier, 35 days old (> 30-day window), electronics
 *   cust-007 order ORD-013  – gold tier, 50 days old (> 45-day window), home-goods
 *
 * FINAL-SALE / DIGITAL CATEGORY DENIAL:
 *   cust-005 order ORD-009  – final-sale category
 *   cust-008 order ORD-015  – digital category
 *   cust-009 order ORD-017  – digital, even within window
 *
 * DEFECTIVE / DAMAGED OVERRIDE (outside window but still refundable + human review flag):
 *   cust-010 order ORD-019  – standard tier, 40 days old, defective
 *   cust-011 order ORD-021  – gold tier, 60 days old, damaged-in-transit
 *   cust-012 order ORD-023  – standard tier, 50 days old, defective
 *
 * REFUND-CAP EXCEEDED (2+ refunds in last 90 days → escalate):
 *   cust-013 order ORD-025  – 3 prior refunds in 90 days → escalation
 *   cust-014 order ORD-027  – 2 prior refunds in 90 days → escalation
 *   cust-015 order ORD-029  – multiple orders, hits refund cap on latest
 * ────────────────────────────────────────────────────────────────────────────
 */

/** Canonical "today" — freeze to a fixed date for deterministic demo math. */
export const TODAY = "2026-07-13";

/**
 * Returns an ISO date string that is `days` before TODAY.
 * @param {number} days
 * @returns {string}
 */
function daysAgo(days) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

/**
 * Returns an ISO date string that is `days` after TODAY.
 * @param {number} days
 * @returns {string}
 */
function daysFromNow(days) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────

export const customers = [
  // ── Branch: CLEAN APPROVAL ──────────────────────────────────────────────

  {
    id: "cust-001",
    name: "Alice Navarro",
    email: "alice.navarro@example.com",
    loyaltyTier: "standard",
    orders: [
      {
        orderId: "ORD-001",
        product: "Wireless Noise-Cancelling Headphones",
        category: "electronics",
        price: 249.99,
        purchaseDate: daysAgo(10),
        deliveryDate: daysAgo(7),
        status: "delivered",
        condition: "unopened",
        // No refund history → clean approval
      },
      {
        orderId: "ORD-002",
        product: "Phone Case",
        category: "electronics",
        price: 19.99,
        purchaseDate: daysAgo(60),
        deliveryDate: daysAgo(57),
        status: "delivered",
        condition: "used",
        refundHistory: [
          {
            refundId: "REF-001",
            refundDate: daysAgo(58),
            amount: 19.99,
            reason: "Wrong size",
          },
        ],
      },
    ],
  },

  {
    id: "cust-002",
    name: "Marcus Webb",
    email: "marcus.webb@example.com",
    loyaltyTier: "gold",
    orders: [
      {
        orderId: "ORD-003",
        product: "Merino Wool Sweater",
        category: "clothing",
        price: 89.0,
        purchaseDate: daysAgo(20),
        deliveryDate: daysAgo(16),
        status: "delivered",
        condition: "unopened",
        // Gold tier, 20 days old (< 45 window) → clean approval
      },
      {
        orderId: "ORD-004",
        product: "Linen Trousers",
        category: "clothing",
        price: 65.0,
        purchaseDate: daysAgo(100),
        deliveryDate: daysAgo(96),
        status: "delivered",
        condition: "used",
        refundHistory: [
          {
            refundId: "REF-002",
            refundDate: daysAgo(98),
            amount: 58.5,
            reason: "Didn't fit",
          },
        ],
      },
    ],
  },

  // ── Branch: EXPIRED WINDOW DENIAL ────────────────────────────────────────

  {
    id: "cust-003",
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    loyaltyTier: "standard",
    orders: [
      {
        orderId: "ORD-005",
        product: "Bluetooth Speaker",
        category: "electronics",
        price: 119.0,
        purchaseDate: daysAgo(35),
        deliveryDate: daysAgo(31),
        status: "delivered",
        condition: "opened-unused",
        // Standard tier: 35 days > 30-day window → EXPIRED DENIAL
      },
      {
        orderId: "ORD-006",
        product: "Charging Cable 3-Pack",
        category: "electronics",
        price: 24.99,
        purchaseDate: daysAgo(5),
        deliveryDate: daysAgo(3),
        status: "delivered",
        condition: "unopened",
      },
    ],
  },

  {
    id: "cust-004",
    name: "Eli Johansson",
    email: "eli.johansson@example.com",
    loyaltyTier: "platinum",
    orders: [
      {
        orderId: "ORD-007",
        product: "Stand Mixer",
        category: "home-goods",
        price: 329.0,
        purchaseDate: daysAgo(40),
        deliveryDate: daysAgo(36),
        status: "delivered",
        condition: "unopened",
        // Platinum tier: 40 days < 45-day window → CLEAN APPROVAL
      },
      {
        orderId: "ORD-008",
        product: "Coffee Grinder",
        category: "home-goods",
        price: 79.0,
        purchaseDate: daysAgo(12),
        deliveryDate: daysAgo(9),
        status: "delivered",
        condition: "used",
      },
    ],
  },

  // ── Branch: FINAL-SALE / DIGITAL CATEGORY DENIAL ─────────────────────────

  {
    id: "cust-005",
    name: "Fatima Al-Hassan",
    email: "fatima.alhassan@example.com",
    loyaltyTier: "gold",
    orders: [
      {
        orderId: "ORD-009",
        product: "Clearance Denim Jacket",
        category: "final-sale",
        price: 34.99,
        purchaseDate: daysAgo(8),
        deliveryDate: daysAgo(5),
        status: "delivered",
        condition: "unopened",
        // Final-sale category → NON-REFUNDABLE DENIAL (regardless of window)
      },
      {
        orderId: "ORD-010",
        product: "Summer Dress",
        category: "clothing",
        price: 54.99,
        purchaseDate: daysAgo(15),
        deliveryDate: daysAgo(12),
        status: "delivered",
        condition: "unopened",
      },
    ],
  },

  {
    id: "cust-006",
    name: "Tom Bergström",
    email: "tom.bergstrom@example.com",
    loyaltyTier: "standard",
    orders: [
      {
        orderId: "ORD-011",
        product: "Running Shorts",
        category: "clothing",
        price: 42.0,
        purchaseDate: daysAgo(28),
        deliveryDate: daysAgo(24),
        status: "delivered",
        condition: "used",
        // Standard tier, 28 days (< 30 window), used → CLEAN APPROVAL + 10% restocking fee
      },
      {
        orderId: "ORD-012",
        product: "Compression Socks",
        category: "clothing",
        price: 18.0,
        purchaseDate: daysAgo(5),
        deliveryDate: daysAgo(3),
        status: "delivered",
        condition: "unopened",
      },
    ],
  },

  {
    id: "cust-007",
    name: "Yuki Tanaka",
    email: "yuki.tanaka@example.com",
    loyaltyTier: "gold",
    orders: [
      {
        orderId: "ORD-013",
        product: "Air Purifier",
        category: "home-goods",
        price: 189.0,
        purchaseDate: daysAgo(50),
        deliveryDate: daysAgo(46),
        status: "delivered",
        condition: "opened-unused",
        // Gold tier: 50 days > 45-day window → EXPIRED DENIAL
      },
    ],
  },

  {
    id: "cust-008",
    name: "Soren Dahl",
    email: "soren.dahl@example.com",
    loyaltyTier: "platinum",
    orders: [
      {
        orderId: "ORD-015",
        product: "Photoshop Annual License",
        category: "digital",
        price: 239.88,
        purchaseDate: daysAgo(3),
        deliveryDate: daysAgo(3),
        status: "delivered",
        condition: "opened-unused",
        // Digital category → NON-REFUNDABLE DENIAL
      },
      {
        orderId: "ORD-016",
        product: "Wireless Keyboard",
        category: "electronics",
        price: 99.0,
        purchaseDate: daysAgo(10),
        deliveryDate: daysAgo(7),
        status: "delivered",
        condition: "unopened",
      },
    ],
  },

  {
    id: "cust-009",
    name: "Amara Osei",
    email: "amara.osei@example.com",
    loyaltyTier: "standard",
    orders: [
      {
        orderId: "ORD-017",
        product: "Cloud Storage Plan (1 Year)",
        category: "digital",
        price: 99.99,
        purchaseDate: daysAgo(5),
        deliveryDate: daysAgo(5),
        status: "delivered",
        condition: "opened-unused",
        // Digital category → NON-REFUNDABLE DENIAL (even within window)
      },
    ],
  },

  // ── Branch: DEFECTIVE / DAMAGED OVERRIDE ─────────────────────────────────

  {
    id: "cust-010",
    name: "Ingrid Müller",
    email: "ingrid.muller@example.com",
    loyaltyTier: "standard",
    orders: [
      {
        orderId: "ORD-019",
        product: "Smart Watch",
        category: "electronics",
        price: 299.0,
        purchaseDate: daysAgo(40),
        deliveryDate: daysAgo(36),
        status: "delivered",
        condition: "defective",
        // Standard tier: 40 days > 30-day window BUT defective → OVERRIDE APPROVAL + human review flag
      },
    ],
  },

  {
    id: "cust-011",
    name: "Carlos Reyes",
    email: "carlos.reyes@example.com",
    loyaltyTier: "gold",
    orders: [
      {
        orderId: "ORD-021",
        product: "Espresso Machine",
        category: "home-goods",
        price: 499.0,
        purchaseDate: daysAgo(60),
        deliveryDate: daysAgo(55),
        status: "delivered",
        condition: "damaged-in-transit",
        // Gold tier: 60 days > 45-day window BUT damaged-in-transit → OVERRIDE APPROVAL + human review flag
      },
      {
        orderId: "ORD-022",
        product: "Milk Frother",
        category: "home-goods",
        price: 29.99,
        purchaseDate: daysAgo(10),
        deliveryDate: daysAgo(7),
        status: "delivered",
        condition: "unopened",
      },
    ],
  },

  {
    id: "cust-012",
    name: "Nadia Petrov",
    email: "nadia.petrov@example.com",
    loyaltyTier: "standard",
    orders: [
      {
        orderId: "ORD-023",
        product: "Robot Vacuum Cleaner",
        category: "home-goods",
        price: 389.0,
        purchaseDate: daysAgo(50),
        deliveryDate: daysAgo(45),
        status: "delivered",
        condition: "defective",
        // Standard tier: 50 days > 30-day window BUT defective → OVERRIDE APPROVAL + human review flag
      },
      {
        orderId: "ORD-024",
        product: "HEPA Filter Set",
        category: "home-goods",
        price: 39.99,
        purchaseDate: daysAgo(20),
        deliveryDate: daysAgo(17),
        status: "delivered",
        condition: "unopened",
      },
    ],
  },

  // ── Branch: REFUND-CAP EXCEEDED (escalation) ──────────────────────────────

  {
    id: "cust-013",
    name: "Léa Fontaine",
    email: "lea.fontaine@example.com",
    loyaltyTier: "gold",
    orders: [
      {
        orderId: "ORD-025",
        product: "Portable Projector",
        category: "electronics",
        price: 359.0,
        purchaseDate: daysAgo(7),
        deliveryDate: daysAgo(4),
        status: "delivered",
        condition: "opened-unused",
        // 3 prior refunds in last 90 days → REFUND CAP EXCEEDED → ESCALATE
        refundHistory: [
          {
            refundId: "REF-010",
            refundDate: daysAgo(85),
            amount: 120.0,
            reason: "Changed mind",
          },
          {
            refundId: "REF-011",
            refundDate: daysAgo(45),
            amount: 79.5,
            reason: "Arrived late",
          },
          {
            refundId: "REF-012",
            refundDate: daysAgo(20),
            amount: 55.0,
            reason: "Wrong item",
          },
        ],
      },
      {
        orderId: "ORD-026",
        product: "HDMI Cable",
        category: "electronics",
        price: 14.99,
        purchaseDate: daysAgo(3),
        deliveryDate: daysAgo(1),
        status: "delivered",
        condition: "unopened",
      },
    ],
  },

  {
    id: "cust-014",
    name: "Omar Khalil",
    email: "omar.khalil@example.com",
    loyaltyTier: "standard",
    orders: [
      {
        orderId: "ORD-027",
        product: "Gaming Mouse",
        category: "electronics",
        price: 149.0,
        purchaseDate: daysAgo(12),
        deliveryDate: daysAgo(9),
        status: "delivered",
        condition: "opened-unused",
        // 2 prior refunds in last 90 days → REFUND CAP EXCEEDED → ESCALATE
        refundHistory: [
          {
            refundId: "REF-013",
            refundDate: daysAgo(70),
            amount: 89.0,
            reason: "Defective",
          },
          {
            refundId: "REF-014",
            refundDate: daysAgo(30),
            amount: 42.0,
            reason: "Wrong color",
          },
        ],
      },
    ],
  },

  {
    id: "cust-015",
    name: "Bianca Rossi",
    email: "bianca.rossi@example.com",
    loyaltyTier: "platinum",
    orders: [
      {
        orderId: "ORD-029",
        product: "4K Monitor",
        category: "electronics",
        price: 649.0,
        purchaseDate: daysAgo(15),
        deliveryDate: daysAgo(11),
        status: "delivered",
        condition: "opened-unused",
        // Platinum tier, 15 days (< 45 window), but 2 recent refunds → REFUND CAP EXCEEDED → ESCALATE
        refundHistory: [
          {
            refundId: "REF-015",
            refundDate: daysAgo(88),
            amount: 320.0,
            reason: "Screen defect",
          },
          {
            refundId: "REF-016",
            refundDate: daysAgo(40),
            amount: 180.0,
            reason: "Arrived damaged",
          },
        ],
      },
      {
        orderId: "ORD-030",
        product: "Monitor Stand",
        category: "home-goods",
        price: 59.99,
        purchaseDate: daysAgo(15),
        deliveryDate: daysAgo(11),
        status: "delivered",
        condition: "unopened",
      },
      {
        orderId: "ORD-031",
        product: "Desk Mat XL",
        category: "home-goods",
        price: 34.99,
        purchaseDate: daysAgo(50),
        deliveryDate: daysAgo(46),
        status: "delivered",
        condition: "used",
        refundHistory: [
          {
            refundId: "REF-017",
            refundDate: daysAgo(48),
            amount: 31.49,
            reason: "Colour mismatch",
          },
        ],
      },
    ],
  },
];
