import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  await prisma.acknowledgment.upsert({
    where: { entryId_userId: { entryId: id, userId } },
    create: { entryId: id, userId },
    update: {},
  });

  return NextResponse.json({ ok: true });
}
