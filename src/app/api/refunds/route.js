/**
 * GET /api/refunds
 * ────────────────
 * Returns all refund records currently held in the in-memory refundStore.
 */

import refundStore from "@/lib/agent/refundStore";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(refundStore.all());
}
