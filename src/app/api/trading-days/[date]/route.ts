import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const tradeUpdateSchema = z.object({
  stockName: z.string().min(1).max(50).optional(),
  tradeType: z.enum(["BUY", "SELL"]).optional(),
  buyPoint: z.number().min(0).nullable().optional(),
  sellPoint: z.number().min(0).nullable().optional(),
  profitLoss: z.number().optional(),
  amount: z.number().gt(0).optional(),
});

// GET /api/trading-days/[date] — get a single trading day
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date } = await params;
  const tradingDate = new Date(date + "T00:00:00.000Z");

  const tradingDay = await prisma.tradingDay.findUnique({
    where: {
      userId_tradingDate: {
        userId: session.user.id,
        tradingDate,
      },
    },
    include: {
      trades: { orderBy: { tradeNumber: "asc" } },
    },
  });

  if (!tradingDay) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(tradingDay);
}

// DELETE /api/trading-days/[date] — delete entire trading day
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date } = await params;
  const tradingDate = new Date(date + "T00:00:00.000Z");

  const tradingDay = await prisma.tradingDay.findUnique({
    where: {
      userId_tradingDate: {
        userId: session.user.id,
        tradingDate,
      },
    },
  });

  if (!tradingDay) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.tradingDay.delete({ where: { id: tradingDay.id } });
  return NextResponse.json({ success: true });
}
