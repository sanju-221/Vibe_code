import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  targetType: z.enum(["WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  targetAmount: z.number().gt(0).optional(),
});

// PUT /api/targets/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const target = await prisma.target.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const updated = await prisma.target.update({
    where: { id },
    data: {
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.targetType && { targetType: parsed.data.targetType }),
      ...(parsed.data.startDate && { startDate: new Date(parsed.data.startDate + "T00:00:00.000Z") }),
      ...(parsed.data.endDate && { endDate: new Date(parsed.data.endDate + "T00:00:00.000Z") }),
      ...(parsed.data.targetAmount && { targetAmount: parsed.data.targetAmount }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/targets/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const target = await prisma.target.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.target.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
