import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await getSession();
  if (!session.userId || (session.role !== "formateur" && session.role !== "admin")) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { sessionId: sessionIdParam } = await params;
  const sessionId = Number(sessionIdParam);
  if (!Number.isInteger(sessionId)) {
    return NextResponse.json({ error: "Séance invalide." }, { status: 400 });
  }

  const exists = db.prepare("SELECT id FROM sessions_formation WHERE id = ?").get(sessionId);
  if (!exists) {
    return NextResponse.json({ error: "Séance introuvable." }, { status: 404 });
  }

  const url = new URL(`/emargement/${sessionId}`, req.nextUrl.origin).toString();
  const png = await QRCode.toBuffer(url, { width: 480, margin: 2 });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
