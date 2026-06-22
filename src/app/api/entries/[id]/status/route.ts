import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: entryId } = await params;
  const userId = (session.user as { id: string }).id;
  const body = await req.json();

  const data: { status?: string; editProgress?: number } = {};

  if (body.status !== undefined) {
    if (!["EN_EDICION", "EDITADO"].includes(body.status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }
    data.status = body.status;
  }

  if (body.editProgress !== undefined) {
    const p = Number(body.editProgress);
    if (isNaN(p) || p < 0 || p > 100) {
      return NextResponse.json({ error: "Progreso inválido" }, { status: 400 });
    }
    data.editProgress = p;
    // Auto-set status based on progress
    if (p === 100) data.status = "EDITADO";
    else if (p > 0) data.status = "EN_EDICION";
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Sin datos" }, { status: 400 });
  }

  const existing = await prisma.entryUserStatus.findUnique({
    where: { entryId_userId: { entryId, userId } },
  });

  const result = await prisma.entryUserStatus.upsert({
    where: { entryId_userId: { entryId, userId } },
    create: { entryId, userId, status: data.status ?? "EN_EDICION", editProgress: data.editProgress ?? 0 },
    update: { ...data, status: data.status ?? existing?.status ?? "EN_EDICION" },
  });

  return NextResponse.json(result);
}
