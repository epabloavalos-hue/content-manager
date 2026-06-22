import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const entries = await prisma.entry.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      eventName: true,
      destinationArea: true,
      createdAt: true,
      createdBy: { select: { name: true } },
      assignments: {
        select: { userId: true, user: { select: { id: true, name: true } } },
      },
      acknowledgments: {
        select: { userId: true },
      },
      userStatuses: {
        select: { userId: true, status: true, editProgress: true, user: { select: { role: true } } },
      },
    },
  });

  return NextResponse.json(entries);
}
