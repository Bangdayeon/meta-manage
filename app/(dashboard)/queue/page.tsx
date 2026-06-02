import { db } from "@/lib/db";
import { scheduledPosts } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { QueueClient } from "./queue-client";

export default async function QueuePage() {
  const posts = await db.select().from(scheduledPosts).orderBy(desc(scheduledPosts.scheduledAt));
  return <QueueClient initialPosts={posts} />;
}
