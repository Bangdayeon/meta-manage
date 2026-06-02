import { db } from "@/lib/db";
import { commentReplies } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { CommentsClient } from "./comments-client";

export default async function CommentsPage() {
  const pending = await db
    .select()
    .from(commentReplies)
    .where(eq(commentReplies.status, "PENDING"))
    .orderBy(desc(commentReplies.createdAt));

  return <CommentsClient initialReplies={pending} />;
}
