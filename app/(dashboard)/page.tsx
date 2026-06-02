import { db } from "@/lib/db";
import { scheduledPosts, commentReplies, settings } from "@/lib/schema";
import { eq, desc, count } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";

export default async function DashboardPage() {
  const [pendingPostsCount] = await db
    .select({ count: count() })
    .from(scheduledPosts)
    .where(eq(scheduledPosts.status, "PENDING"));

  const [pendingRepliesCount] = await db
    .select({ count: count() })
    .from(commentReplies)
    .where(eq(commentReplies.status, "PENDING"));

  const recentPosts = await db
    .select()
    .from(scheduledPosts)
    .orderBy(desc(scheduledPosts.scheduledAt))
    .limit(5);

  const [cfg] = await db.select().from(settings).where(eq(settings.id, 1));
  const isConnected = !!cfg?.accessToken;

  const statusColor = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PUBLISHED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>

      {!isConnected && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-700">
          Instagram 계정이 연결되지 않았어요.{" "}
          <Link href="/settings" className="underline font-medium">설정에서 연결하기</Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">예약된 게시물</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingPostsCount.count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">승인 대기 댓글</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingRepliesCount.count}</p>
            {pendingRepliesCount.count > 0 && (
              <Link href="/comments" className="text-xs text-blue-600 underline">승인하러 가기</Link>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Instagram 연결</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "연결됨" : "미연결"}
            </Badge>
            {cfg?.tokenExpiresAt && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(cfg.tokenExpiresAt, { addSuffix: true, locale: ko })} 만료
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">예정된 게시물</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              예약된 게시물이 없어요.{" "}
              <Link href="/queue" className="underline">지금 추가하기</Link>
            </p>
          ) : (
            <div className="divide-y">
              {recentPosts.map((post) => (
                <div key={post.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={post.blobUrl} alt="" className="w-12 h-12 rounded object-cover bg-gray-100" />
                    <div>
                      <p className="text-sm font-medium line-clamp-1">{post.caption || "(캡션 없음)"}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(post.scheduledAt, "M월 d일 HH:mm", { locale: ko })} · {post.postType}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[post.status]}`}>
                    {post.status === "PENDING" ? "예약" : post.status === "PUBLISHED" ? "게시됨" : "실패"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
