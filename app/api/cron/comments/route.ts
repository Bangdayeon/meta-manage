import { db } from "@/lib/db";
import { commentReplies, settings } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getNewComments, getRecentCaptions } from "@/lib/meta";
import { generateReply } from "@/lib/claude";
import { NextResponse } from "next/server";

function verifyCronSecret(req: Request) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

export async function POST(req: Request) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [cfg] = await db.select().from(settings).where(eq(settings.id, 1));
  if (!cfg?.accessToken || !cfg?.igUserId) {
    return NextResponse.json({ skipped: "Meta 계정 미연결" });
  }

  const since = new Date(Date.now() - 31 * 60 * 1000); // 31분 전
  const comments = await getNewComments(cfg.igUserId!, cfg.accessToken!, since);

  const captions = await getRecentCaptions(cfg.igUserId!, cfg.accessToken!).catch(() => [] as string[]);

  let created = 0;
  for (const c of comments) {
    // 이미 처리한 댓글 스킵
    const existing = await db
      .select()
      .from(commentReplies)
      .where(eq(commentReplies.instagramCommentId, c.id));
    if (existing.length > 0) continue;

    const reply = await generateReply(c.text, c.username, captions);
    await db.insert(commentReplies).values({
      instagramCommentId: c.id,
      commentText: c.text,
      commenterUsername: c.username,
      postInstagramId: c.mediaId,
      generatedReply: reply,
    });
    created++;
  }

  return NextResponse.json({ checked: comments.length, created });
}
