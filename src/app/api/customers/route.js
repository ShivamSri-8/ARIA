/**
 * GET /api/customers
 * ──────────────────
 * Returns a summarised list of all 15 mock customers for the picker dropdown.
 * Shape per item: { id, name, loyaltyTier, orders: [{ orderId, product, category, status }] }
 */

import { customers } from "@/lib/data/customers";

export async function GET() {
  const summary = customers.map((c) => ({
    id: c.id,
    name: c.name,
    loyaltyTier: c.loyaltyTier,
    orders: c.orders.map((o) => ({
      orderId: o.orderId,
      product: o.product,
      category: o.category,
      status: o.status,
    })),
  }));

  return Response.json(summary);
}
