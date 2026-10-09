import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const addTradeSchema = z.object({
  tradingDayId: z.string().min(1),
  stockName: z.string().min(1).max(50),
  tradeType: z.enum(["BUY", "SELL"]),
  buyPoint: z.number().min(0).nullable().optional(),
  sellPoint: z.number().min(0).nullable().optional(),
  profitLoss: z.number(),
  amount: z.number().gt(0),
});

// POST /api/trades — add a trade to existing trading day
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = addTradeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  // Verify ownership
  const tradingDay = await prisma.tradingDay.findFirst({
    where: { id: parsed.data.tradingDayId, userId: session.user.id },
    include: { trades: true },
  });
  if (!tradingDay) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const nextTradeNumber = tradingDay.trades.reduce((m, t) => Math.max(m, t.tradeNumber), 0) + 1;
  const trade = await prisma.trade.create({
    data: {
      tradingDayId: parsed.data.tradingDayId,
      tradeNumber: nextTradeNumber,
      stockName: parsed.data.stockName.toUpperCase(),
      tradeType: parsed.data.tradeType,
      buyPoint: parsed.data.buyPoint ?? null,
      sellPoint: parsed.data.sellPoint ?? null,
      profitLoss: parsed.data.profitLoss,
      amount: parsed.data.amount,
    },
  });

  return NextResponse.json(trade, { status: 201 });
}
