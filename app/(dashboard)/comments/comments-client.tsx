"use client";

import { useState } from "react";
import { CommentReply } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export function CommentsClient({ initialReplies }: { initialReplies: CommentReply[] }) {
  const [replies, setReplies] = useState<CommentReply[]>(initialReplies);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  async function handleApprove(id: string) {
    setLoading((l) => ({ ...l, [id]: true }));
    const res = await fetch(`/api/comments/${id}/approve`, { method: "POST" });
    if (res.ok) {
      setReplies((r) => r.filter((reply) => reply.id !== id));
      toast.success("대댓글이 게시됐어요!");
    } else {
      const data = await res.json();
      toast.error(data.error ?? "오류가 발생했어요");
    }
    setLoading((l) => ({ ...l, [id]: false }));
  }

  async function handleReject(id: string) {
    setLoading((l) => ({ ...l, [id]: true }));
    await fetch(`/api/comments/${id}/reject`, { method: "POST" });
    setReplies((r) => r.filter((reply) => reply.id !== id));
    toast.success("거절했어요");
    setLoading((l) => ({ ...l, [id]: false }));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">댓글 승인</h1>
      <p className="text-sm text-muted-foreground">AI가 생성한 대댓글을 검토하고 승인하면 바로 게시돼요.</p>

      {replies.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>대기 중인 대댓글이 없어요 🎉</p>
          <p className="text-xs mt-1">30분마다 새 댓글을 수집해요</p>
        </div>
      ) : (
        <div className="space-y-4">
          {replies.map((reply) => (
            <Card key={reply.id}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-sm font-medium">@{reply.commenterUsername}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {formatDistanceToNow(reply.createdAt, { addSuffix: true, locale: ko })}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded p-3 text-sm">
                  <p className="text-muted-foreground text-xs mb-1">원댓글</p>
                  <p>{reply.commentText}</p>
                </div>

                <div className="bg-blue-50 rounded p-3 text-sm border border-blue-100">
                  <p className="text-blue-600 text-xs mb-1 font-medium">AI 생성 대댓글</p>
                  <p>{reply.generatedReply}</p>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReject(reply.id)}
                    disabled={loading[reply.id]}
                  >
                    거절
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(reply.id)}
                    disabled={loading[reply.id]}
                  >
                    {loading[reply.id] ? "게시 중..." : "승인 · 게시"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
