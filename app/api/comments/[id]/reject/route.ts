import { auth } from "@/auth";
import { db } from "@/lib/db";
import { commentReplies } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.update(commentReplies).set({ status: "REJECTED" }).where(eq(commentReplies.id, id));
  return NextResponse.json({ ok: true });
}
