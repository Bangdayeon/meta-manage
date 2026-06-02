import { auth } from "@/auth";
import { db } from "@/lib/db";
import { scheduledPosts } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  blobUrl: z.string().url(),
  caption: z.string().optional(),
  postType: z.enum(["IMAGE", "REEL"]).default("IMAGE"),
  scheduledAt: z.string().datetime(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const posts = await db
    .select()
    .from(scheduledPosts)
    .orderBy(desc(scheduledPosts.scheduledAt));
  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [post] = await db
    .insert(scheduledPosts)
    .values({
      blobUrl: parsed.data.blobUrl,
      caption: parsed.data.caption,
      postType: parsed.data.postType,
      scheduledAt: new Date(parsed.data.scheduledAt),
    })
    .returning();

  return NextResponse.json(post);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await db.delete(scheduledPosts).where(eq(scheduledPosts.id, id));
  return NextResponse.json({ ok: true });
}
