import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!["jpg", "jpeg", "png"].includes(ext || "")) {
    return NextResponse.json({ error: "Solo JPG o PNG" }, { status: 400 });
  }

  const filename = `proof/proof_${id}_${Date.now()}.${ext}`;
  const blob = await put(filename, file, { access: "public", addRandomSuffix: false });
  const proofImagePath = blob.url;
  await prisma.entry.update({ where: { id }, data: { proofImagePath } });

  return NextResponse.json({ proofImagePath });
}
