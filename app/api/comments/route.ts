import { auth } from "@/auth";
import { db } from "@/lib/db";
import { commentReplies } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "PENDING";

  const replies = await db
    .select()
    .from(commentReplies)
    .where(eq(commentReplies.status, status as "PENDING" | "APPROVED" | "REJECTED" | "PUBLISHED"))
    .orderBy(desc(commentReplies.createdAt));

  return NextResponse.json(replies);
}
