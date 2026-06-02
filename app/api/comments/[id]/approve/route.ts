import { auth } from "@/auth";
import { db } from "@/lib/db";
import { commentReplies, settings } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { postReply } from "@/lib/meta";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [reply] = await db.select().from(commentReplies).where(eq(commentReplies.id, id));
  if (!reply) return NextResponse.json({ error: "댓글을 찾을 수 없어요" }, { status: 404 });

  const [cfg] = await db.select().from(settings).where(eq(settings.id, 1));
  if (!cfg?.accessToken) return NextResponse.json({ error: "Meta 계정이 연결되지 않았어요" }, { status: 400 });

  await postReply(reply.instagramCommentId, cfg.accessToken, reply.generatedReply);

  await db
    .update(commentReplies)
    .set({ status: "PUBLISHED" })
    .where(eq(commentReplies.id, id));

  return NextResponse.json({ ok: true });
}
