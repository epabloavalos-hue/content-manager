import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Endpoint de servicio a servicio para que apps externas (p.ej. video-requests)
// creen fichas técnicas sin pasar por sesión de next-auth. Se autentica con
// el header x-api-key contra EXTERNAL_API_KEY.
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.EXTERNAL_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      driveLink,
      linkType,
      eventName,
      eventType,
      recordingDate,
      contentResponsible,
      destinationArea,
      notes,
      createdByEmail,
    } = body;

    if (!driveLink || !eventName || !recordingDate || !contentResponsible || !destinationArea) {
      return NextResponse.json(
        { error: "driveLink, eventName, recordingDate, contentResponsible y destinationArea son obligatorios" },
        { status: 400 }
      );
    }

    let createdBy = createdByEmail
      ? await prisma.user.findUnique({ where: { email: createdByEmail } })
      : null;
    if (!createdBy) {
      createdBy = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    }
    if (!createdBy) {
      return NextResponse.json({ error: "No se encontró un usuario ADMIN para asociar la ficha" }, { status: 500 });
    }

    const entry = await prisma.entry.create({
      data: {
        driveLink,
        linkType: linkType || "FOLDER",
        eventName,
        eventType: eventType || "OTRO",
        recordingDate: new Date(recordingDate),
        contentResponsible,
        destinationArea,
        notes: notes || null,
        createdById: createdBy.id,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("Error creando ficha técnica externa:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
