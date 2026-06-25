import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const folders = await prisma.importantFolder.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(folders);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, description, driveLink, color } = await req.json();
  if (!name || !driveLink) {
    return NextResponse.json({ error: "name y driveLink son requeridos" }, { status: 400 });
  }

  const folder = await prisma.importantFolder.create({
    data: { name, description: description || null, driveLink, color: color || "#22c55e" },
  });
  return NextResponse.json(folder, { status: 201 });
}
