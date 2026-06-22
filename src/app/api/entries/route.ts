import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyNewEntry } from "@/lib/telegram";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const eventType = searchParams.get("eventType") || "";
  const destinationArea = searchParams.get("destinationArea") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";

  const where: Record<string, unknown> = {};

  if (q) {
    where.OR = [
      { eventName: { contains: q } },
      { contentResponsible: { contains: q } },
      { notes: { contains: q } },
    ];
  }
  if (eventType) where.eventType = eventType;
  if (destinationArea) where.destinationArea = destinationArea;
  if (dateFrom || dateTo) {
    where.recordingDate = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo + "T23:59:59Z") } : {}),
    };
  }

  const entries = await prisma.entry.findMany({
    where,
    include: { createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const assignedUserIds: string[] = body.assignedUserIds ?? [];

    const entry = await prisma.entry.create({
      data: {
        driveLink: body.driveLink,
        linkType: body.linkType,
        eventName: body.eventName,
        eventType: body.eventType,
        recordingDate: new Date(body.recordingDate),
        contentResponsible: body.contentResponsible,
        destinationArea: body.destinationArea,
        notes: body.notes || null,
        createdById: (session.user as { id: string }).id,
        assignments: assignedUserIds.length > 0
          ? { create: assignedUserIds.map((userId) => ({ userId })) }
          : undefined,
      },
      include: { createdBy: { select: { name: true } } },
    });

    notifyNewEntry(entry).catch((err) => console.error("Telegram notify error:", err));

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("Error creating entry:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
