"use client";

import { useState, useRef } from "react";
import { ScheduledPost } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export function QueueClient({ initialPosts }: { initialPosts: ScheduledPost[] }) {
  const [posts, setPosts] = useState<ScheduledPost[]>(initialPosts);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [blobUrl, setBlobUrl] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [postType, setPostType] = useState<"IMAGE" | "REEL">("IMAGE");
  const [scheduledAt, setScheduledAt] = useState("");
  const [captionContext, setCaptionContext] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    setBlobUrl(data.url);
    setUploading(false);
    toast.success("이미지 업로드 완료");
  }

  async function handleGenerateCaption() {
    if (!captionContext) {
      toast.error("이번 화 내용을 입력해주세요");
      return;
    }
    setGenerating(true);
    const res = await fetch("/api/generate-caption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context: captionContext }),
    });
    const data = await res.json();
    setCaption(data.caption ?? "");
    setGenerating(false);
    toast.success("캡션 생성 완료");
  }

  async function handleSave() {
    if (!blobUrl) { toast.error("이미지를 먼저 업로드해주세요"); return; }
    if (!scheduledAt) { toast.error("예약 시간을 설정해주세요"); return; }
    setSaving(true);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blobUrl, caption, postType, scheduledAt: new Date(scheduledAt).toISOString() }),
    });
    const post = await res.json();
    setPosts([post, ...posts]);
    // 폼 초기화
    setPreviewUrl(""); setBlobUrl(""); setCaption(""); setScheduledAt(""); setCaptionContext("");
    if (fileRef.current) fileRef.current.value = "";
    setSaving(false);
    toast.success("예약 완료!");
  }

  async function handleDelete(id: string) {
    await fetch("/api/posts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setPosts(posts.filter((p) => p.id !== id));
    toast.success("삭제됐어요");
  }

  const statusColor = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PUBLISHED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">예약 큐</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">새 게시물 추가</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>이미지 / 영상</Label>
              <Input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFileChange} disabled={uploading} />
              {uploading && <p className="text-xs text-muted-foreground">업로드 중...</p>}
              {previewUrl && (
                <img src={previewUrl} alt="preview" className="w-full h-40 object-cover rounded border" />
              )}
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>종류</Label>
                <Select value={postType} onValueChange={(v) => setPostType(v as "IMAGE" | "REEL")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IMAGE">이미지</SelectItem>
                    <SelectItem value="REEL">릴스</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>예약 시간</Label>
                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>이번 화 내용 (AI 캡션 생성용)</Label>
            <div className="flex gap-2">
              <Input
                value={captionContext}
                onChange={(e) => setCaptionContext(e.target.value)}
                placeholder="예: 주인공이 고양이를 만나는 장면, 감동적인 엔딩"
              />
              <Button variant="outline" onClick={handleGenerateCaption} disabled={generating}>
                {generating ? "생성 중..." : "AI 생성"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>캡션</Label>
            <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={4} placeholder="직접 입력하거나 AI로 생성하세요" />
          </div>

          <Button onClick={handleSave} disabled={saving || uploading} className="w-full">
            {saving ? "저장 중..." : "예약 등록"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">예약 목록</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">예약된 게시물이 없어요</p>
        ) : (
          posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="py-4 flex items-center gap-4">
                <img src={post.blobUrl} alt="" className="w-16 h-16 rounded object-cover bg-gray-100 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2">{post.caption || "(캡션 없음)"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(post.scheduledAt, "yyyy.MM.dd HH:mm", { locale: ko })} · {post.postType}
                  </p>
                  {post.errorMessage && <p className="text-xs text-red-500 mt-1">{post.errorMessage}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[post.status]}`}>
                    {post.status === "PENDING" ? "예약" : post.status === "PUBLISHED" ? "게시됨" : "실패"}
                  </span>
                  {post.status === "PENDING" && (
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(post.id)}>
                      삭제
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
