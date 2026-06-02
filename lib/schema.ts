import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const postStatusEnum = pgEnum("post_status", [
  "PENDING",
  "PUBLISHED",
  "FAILED",
]);

export const postTypeEnum = pgEnum("post_type", ["IMAGE", "REEL"]);

export const replyStatusEnum = pgEnum("reply_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "PUBLISHED",
]);

export const scheduledPosts = pgTable("scheduled_posts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  blobUrl: text("blob_url").notNull(),
  caption: text("caption"),
  postType: postTypeEnum("post_type").notNull().default("IMAGE"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  status: postStatusEnum("status").notNull().default("PENDING"),
  instagramMediaId: text("instagram_media_id"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const commentReplies = pgTable("comment_replies", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  instagramCommentId: text("instagram_comment_id").notNull().unique(),
  commentText: text("comment_text").notNull(),
  commenterUsername: text("commenter_username").notNull(),
  postInstagramId: text("post_instagram_id").notNull(),
  generatedReply: text("generated_reply").notNull(),
  status: replyStatusEnum("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  igUserId: text("ig_user_id"),
  accessToken: text("access_token"),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
  postingIntervalDays: integer("posting_interval_days").notNull().default(3),
  defaultHour: integer("default_hour").notNull().default(18),
  defaultMinute: integer("default_minute").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type CommentReply = typeof commentReplies.$inferSelect;
export type Settings = typeof settings.$inferSelect;
