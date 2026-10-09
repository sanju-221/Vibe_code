import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const updateSchema = z.object({
  stockName: z.string().min(1).max(50).optional(),
  tradeType: z.enum(["BUY", "SELL"]).optional(),
  buyPoint: z.number().min(0).nullable().optional(),
  sellPoint: z.number().min(0).nullable().optional(),
  profitLoss: z.number().optional(),
  amount: z.number().gt(0).optional(),
});

// PUT /api/trades/[id] — update a trade
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership through TradingDay
  const trade = await prisma.trade.findFirst({
    where: { id, tradingDay: { userId: session.user.id } },
  });
  if (!trade) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const updated = await prisma.trade.update({
    where: { id },
    data: {
      ...(parsed.data.stockName && { stockName: parsed.data.stockName.toUpperCase() }),
      ...(parsed.data.tradeType && { tradeType: parsed.data.tradeType }),
      ...(parsed.data.buyPoint !== undefined && { buyPoint: parsed.data.buyPoint }),
      ...(parsed.data.sellPoint !== undefined && { sellPoint: parsed.data.sellPoint }),
      ...(parsed.data.profitLoss !== undefined && { profitLoss: parsed.data.profitLoss }),
      ...(parsed.data.amount !== undefined && { amount: parsed.data.amount }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/trades/[id] — delete a trade
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const trade = await prisma.trade.findFirst({
    where: { id, tradingDay: { userId: session.user.id } },
  });
  if (!trade) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.trade.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
