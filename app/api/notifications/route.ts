import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const items = db
    .prepare(
      `SELECT id, type, message, session_id, created_at, read_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 20`
    )
    .all(session.userId);

  const { unread } = db
    .prepare("SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND read_at IS NULL")
    .get(session.userId) as { unread: number };

  return NextResponse.json({ items, unread });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const id = typeof body?.id === "number" ? body.id : null;

  if (id) {
    db.prepare(
      "UPDATE notifications SET read_at = datetime('now') WHERE id = ? AND user_id = ? AND read_at IS NULL"
    ).run(id, session.userId);
  } else {
    db.prepare(
      "UPDATE notifications SET read_at = datetime('now') WHERE user_id = ? AND read_at IS NULL"
    ).run(session.userId);
  }

  return NextResponse.json({ ok: true });
}
