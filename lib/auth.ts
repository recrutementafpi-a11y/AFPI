import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type Role = "admin" | "formateur" | "stagiaire";

export interface SessionData {
  userId?: number;
  role?: Role;
  nom?: string;
  prenom?: string;
}

const secret = process.env.SESSION_SECRET ?? "dev-only-secret-change-me-32chars!!";

export const sessionOptions: SessionOptions = {
  password: secret,
  cookieName: "afpi_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
