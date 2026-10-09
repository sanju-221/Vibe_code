import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const targetSchema = z.object({
  name: z.string().min(1).max(100),
  targetType: z.enum(["WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"]),
  startDate: z.string(),
  endDate: z.string(),
  targetAmount: z.number().gt(0),
});

// GET /api/targets
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targets = await prisma.target.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(targets);
}

// POST /api/targets
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = targetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 });
  }

  const target = await prisma.target.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      targetType: parsed.data.targetType,
      startDate: new Date(parsed.data.startDate + "T00:00:00.000Z"),
      endDate: new Date(parsed.data.endDate + "T00:00:00.000Z"),
      targetAmount: parsed.data.targetAmount,
    },
  });

  return NextResponse.json(target, { status: 201 });
}
