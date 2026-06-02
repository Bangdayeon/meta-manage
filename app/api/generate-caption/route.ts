import { auth } from "@/auth";
import { db } from "@/lib/db";
import { settings } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getRecentCaptions } from "@/lib/meta";
import { generateCaption } from "@/lib/claude";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { context } = await req.json();
  if (!context) return NextResponse.json({ error: "context가 필요해요" }, { status: 400 });

  const [cfg] = await db.select().from(settings).where(eq(settings.id, 1));

  let captions: string[] = [];
  if (cfg?.accessToken && cfg?.igUserId) {
    try {
      captions = await getRecentCaptions(cfg.igUserId, cfg.accessToken);
    } catch {
      // 토큰 만료 등 오류 시 샘플 없이 진행
    }
  }

  const caption = await generateCaption(captions, context);
  return NextResponse.json({ caption });
}
