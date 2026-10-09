import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const tradeSchema = z.object({
  tradeNumber: z.number().int().min(1),
  stockName: z.string().min(1).max(50),
  tradeType: z.enum(["BUY", "SELL"]),
  buyPoint: z.number().min(0).optional().nullable(),
  sellPoint: z.number().min(0).optional().nullable(),
  profitLoss: z.number(),
  amount: z.number().gt(0),
});

const bodySchema = z.object({
  tradingDate: z.string().min(1),
  dayType: z.enum(["TRADE", "NO_TRADE", "HOLIDAY"]).default("TRADE"),
  trades: z.array(tradeSchema).optional(),
});

// GET /api/trading-days — list all trading days for user
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "25");
  const skip = (page - 1) * limit;

  const [days, total] = await Promise.all([
    prisma.tradingDay.findMany({
      where: { userId },
      include: { trades: true },
      orderBy: { tradingDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.tradingDay.count({ where: { userId } }),
  ]);

  return NextResponse.json({ days, total, page, limit });
}

// POST /api/trading-days — create trading day (trade / no-trade / holiday)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { tradingDate, dayType, trades } = parsed.data;
  const date = new Date(tradingDate + "T00:00:00.000Z");

  // Trades required only when dayType is TRADE
  if (dayType === "TRADE" && (!trades || trades.length === 0)) {
    return NextResponse.json({ error: "At least one trade is required." }, { status: 400 });
  }

  // Check for existing record
  const existing = await prisma.tradingDay.findUnique({
    where: { userId_tradingDate: { userId: session.user.id, tradingDate: date } },
    include: { trades: { select: { tradeNumber: true } } },
  });

  if (existing) {
    // Adding more trades to an existing date
    if (dayType === "TRADE" && trades && trades.length > 0) {
      try {
        const startNumber = existing.trades.reduce((m, t) => Math.max(m, t.tradeNumber), 0);
        await prisma.$transaction(async (tx) => {
          if (existing.dayType !== "TRADE") {
            await tx.tradingDay.update({ where: { id: existing.id }, data: { dayType: "TRADE" } });
          }
          await tx.trade.createMany({
            data: trades.map((t, i) => ({
              tradingDayId: existing.id,
              tradeNumber: startNumber + i + 1,
              stockName: t.stockName.toUpperCase(),
              tradeType: t.tradeType,
              buyPoint: t.buyPoint ?? null,
              sellPoint: t.sellPoint ?? null,
              profitLoss: t.profitLoss,
              amount: t.amount,
            })),
          });
        });
        return NextResponse.json({ success: true, tradingDayId: existing.id, appended: true }, { status: 200 });
      } catch (err) {
        console.error("Error appending trades:", err);
        return NextResponse.json({ error: "We couldn't save your data. Please try again." }, { status: 500 });
      }
    }

    return NextResponse.json(
      {
        error: "A record for this date already exists. Open it in Trade History to edit it.",
        existingDate: tradingDate,
      },
      { status: 409 }
    );
  }

  try {
    const tradingDay = await prisma.$transaction(async (tx) => {
      const day = await tx.tradingDay.create({
        data: {
          userId: session.user!.id as string,
          tradingDate: date,
          dayType,
        },
      });

      if (dayType === "TRADE" && trades && trades.length > 0) {
        await tx.trade.createMany({
          data: trades.map((t) => ({
            tradingDayId: day.id,
            tradeNumber: t.tradeNumber,
            stockName: t.stockName.toUpperCase(),
            tradeType: t.tradeType,
            buyPoint: t.buyPoint ?? null,
            sellPoint: t.sellPoint ?? null,
            profitLoss: t.profitLoss,
            amount: t.amount,
          })),
        });
      }

      return day;
    });

    return NextResponse.json({ success: true, tradingDayId: tradingDay.id }, { status: 201 });
  } catch (err) {
    console.error("Error creating trading day:", err);
    return NextResponse.json(
      { error: "We couldn't save your data. Please try again." },
      { status: 500 }
    );
  }
}
