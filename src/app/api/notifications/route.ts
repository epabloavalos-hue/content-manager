import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionUser = session.user as { id: string; role: string };
  const isAdmin = sessionUser.role === "ADMIN";

  const me = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { notifyArea: true },
  });

  const [entries, pendingUsers] = await Promise.all([
    prisma.entry.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        createdBy: { select: { name: true } },
        acknowledgments: { select: { userId: true } },
        assignments: { select: { userId: true } },
      },
    }),
    isAdmin
      ? prisma.user.findMany({
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true, email: true, position: true, department: true, phone: true, createdAt: true },
        })
      : Promise.resolve([]),
  ]);

  // Filter entries for non-admin users with a notifyArea
  let filtered = entries;
  if (!isAdmin && me?.notifyArea) {
    filtered = entries.filter((e) =>
      e.destinationArea.split(",").includes(me.notifyArea!) ||
      e.assignments.some((a) => a.userId === sessionUser.id)
    );
  } else if (!isAdmin) {
    // Show entries where this user is assigned
    filtered = entries.filter((e) =>
      e.assignments.some((a) => a.userId === sessionUser.id)
    );
  }

  const enriched = filtered.map((entry) => {
    const totalExpected = entry.assignments.length;
    const ackCount = entry.acknowledgments.length;
    const userAcked = entry.acknowledgments.some((a) => a.userId === sessionUser.id);
    const userAssigned = entry.assignments.some((a) => a.userId === sessionUser.id);

    const { acknowledgments: _a, assignments: _b, ...rest } = entry;
    return { ...rest, ackCount, totalExpected, userAcked, userAssigned };
  });

  return NextResponse.json({ entries: enriched, pendingUsers });
}
