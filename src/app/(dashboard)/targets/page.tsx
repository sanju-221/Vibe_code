import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { TargetsClient } from "@/components/targets/TargetsClient";
import { TargetRecord } from "@/lib/calculations/analytics";

export default async function TargetsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // Fetch all targets
  const targets = await prisma.target.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  // For each target, calculate achieved amount from trades
  const targetsWithProgress = await Promise.all(
    targets.map(async (target: TargetRecord) => {
      const trades = await prisma.trade.findMany({
        where: {
          tradingDay: {
            userId,
            tradingDate: {
              gte: target.startDate,
              lte: target.endDate,
            },
          },
        },
        select: { profitLoss: true },
      });
      const achieved = trades.reduce((sum: number, t: { profitLoss: number }) => sum + t.profitLoss, 0);
      return { ...target, achieved };
    })
  );

  return <TargetsClient targets={targetsWithProgress} />;
}
