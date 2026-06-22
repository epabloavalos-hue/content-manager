import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const entry = await prisma.entry.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true, email: true } },
      assignments: { select: { userId: true, user: { select: { id: true, name: true, position: true } } } },
      userStatuses: { select: { userId: true, status: true, editProgress: true, user: { select: { name: true, role: true } } } },
    },
  });

  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(entry);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.driveLink !== undefined) data.driveLink = body.driveLink;
  if (body.linkType !== undefined) data.linkType = body.linkType;
  if (body.eventName !== undefined) data.eventName = body.eventName;
  if (body.eventType !== undefined) data.eventType = body.eventType;
  if (body.recordingDate !== undefined) data.recordingDate = new Date(body.recordingDate);
  if (body.contentResponsible !== undefined) data.contentResponsible = body.contentResponsible;
  if (body.destinationArea !== undefined) data.destinationArea = body.destinationArea;
  if (body.proofImagePath !== undefined) data.proofImagePath = body.proofImagePath;
  if (body.notes !== undefined) data.notes = body.notes;

  // Update assignments if provided
  if (body.assignedUserIds !== undefined) {
    const userIds: string[] = body.assignedUserIds;
    data.assignments = {
      deleteMany: {},
      create: userIds.map((userId) => ({ userId })),
    };
  }

  try {
    const entry = await prisma.entry.update({ where: { id }, data });
    return NextResponse.json(entry);
  } catch (err) {
    console.error("Error updating entry:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.entry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
