import { db } from "@/lib/db";
import { scheduledPosts, settings } from "@/lib/schema";
import { eq, lte, and } from "drizzle-orm";
import { publishImage, publishReel, refreshToken } from "@/lib/meta";
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

  // 토큰 7일 내 만료 시 갱신
  if (cfg.tokenExpiresAt && cfg.tokenExpiresAt < new Date(Date.now() + 7 * 86400_000)) {
    const { token, expiresAt } = await refreshToken(cfg.accessToken);
    await db.update(settings).set({ accessToken: token, tokenExpiresAt: expiresAt }).where(eq(settings.id, 1));
    cfg.accessToken = token;
  }

  const due = await db
    .select()
    .from(scheduledPosts)
    .where(and(eq(scheduledPosts.status, "PENDING"), lte(scheduledPosts.scheduledAt, new Date())));

  const results = [];
  for (const post of due) {
    try {
      let mediaId: string;
      if (post.postType === "REEL") {
        mediaId = await publishReel(cfg.igUserId!, cfg.accessToken!, post.blobUrl, post.caption ?? "");
      } else {
        mediaId = await publishImage(cfg.igUserId!, cfg.accessToken!, post.blobUrl, post.caption ?? "");
      }
      await db.update(scheduledPosts).set({ status: "PUBLISHED", instagramMediaId: mediaId }).where(eq(scheduledPosts.id, post.id));
      results.push({ id: post.id, ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await db.update(scheduledPosts).set({ status: "FAILED", errorMessage: msg }).where(eq(scheduledPosts.id, post.id));
      results.push({ id: post.id, ok: false, error: msg });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
