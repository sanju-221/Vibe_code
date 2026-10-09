import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { TradeHistoryClient } from "@/components/trades/TradeHistoryClient";

export default async function TradeHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 25;
  const skip = (page - 1) * limit;

  const [days, total] = await Promise.all([
    prisma.tradingDay.findMany({
      where: { userId: session.user.id },
      include: { trades: { orderBy: { tradeNumber: "asc" } } },
      orderBy: { tradingDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.tradingDay.count({ where: { userId: session.user.id } }),
  ]);

  // Serialize dates for client component
  const serialized = days.map((d) => ({
    ...d,
    tradingDate: d.tradingDate.toISOString(),
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    trades: d.trades.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trade History</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {total} trading day{total !== 1 ? "s" : ""} recorded
          </p>
        </div>
        <Link
          href="/trades/new"
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Add Trade
        </Link>
      </div>

      {days.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">No trading days yet</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Start by recording your first trading day.
          </p>
          <Link
            href="/trades/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Add Trade
          </Link>
        </div>
      ) : (
        <TradeHistoryClient
          initialDays={serialized}
          total={total}
          page={page}
          limit={limit}
        />
      )}
    </div>
  );
}
