"use client";

import { useState } from "react";
import { Settings } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export function SettingsClient({ settings }: { settings: Settings | null }) {
  const [intervalDays, setIntervalDays] = useState(String(settings?.postingIntervalDays ?? 3));
  const [defaultHour, setDefaultHour] = useState(String(settings?.defaultHour ?? 18));
  const [defaultMinute, setDefaultMinute] = useState(String(settings?.defaultMinute ?? 0));
  const [saving, setSaving] = useState(false);

  const isConnected = !!settings?.accessToken;

  async function handleSaveSchedule() {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postingIntervalDays: Number(intervalDays),
        defaultHour: Number(defaultHour),
        defaultMinute: Number(defaultMinute),
      }),
    });
    if (res.ok) toast.success("저장됐어요");
    else toast.error("저장 실패");
    setSaving(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">설정</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Instagram 계정 연결</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "연결됨" : "미연결"}
            </Badge>
            {isConnected && settings?.igUserId && (
              <span className="text-sm text-muted-foreground">계정 ID: {settings.igUserId}</span>
            )}
          </div>
          {isConnected && settings?.tokenExpiresAt && (
            <p className="text-sm text-muted-foreground">
              토큰 만료: {format(settings.tokenExpiresAt, "yyyy년 M월 d일", { locale: ko })}
            </p>
          )}
          <a
            href="/api/meta/connect"
            className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              isConnected
                ? "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {isConnected ? "재연결" : "Instagram 연결하기"}
          </a>
          <div className="text-xs text-muted-foreground space-y-1 bg-gray-50 p-3 rounded">
            <p className="font-medium">연결 전 확인사항:</p>
            <p>• Instagram Professional(비즈니스/크리에이터) 계정이어야 해요</p>
            <p>• Facebook 페이지와 연결된 계정이어야 해요</p>
            <p>• Meta Developer App이 설정되어 있어야 해요</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">자동 게시 설정</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>게시 주기 (일)</Label>
            <Input
              type="number"
              min="1"
              max="30"
              value={intervalDays}
              onChange={(e) => setIntervalDays(e.target.value)}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">큐에서 자동으로 다음 예약 시간을 계산할 때 사용해요</p>
          </div>
          <div className="flex gap-4">
            <div className="space-y-2">
              <Label>기본 게시 시간 (시)</Label>
              <Input
                type="number"
                min="0"
                max="23"
                value={defaultHour}
                onChange={(e) => setDefaultHour(e.target.value)}
                className="w-24"
              />
            </div>
            <div className="space-y-2">
              <Label>기본 게시 시간 (분)</Label>
              <Input
                type="number"
                min="0"
                max="59"
                value={defaultMinute}
                onChange={(e) => setDefaultMinute(e.target.value)}
                className="w-24"
              />
            </div>
          </div>
          <Button onClick={handleSaveSchedule} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">환경변수 체크리스트</CardTitle></CardHeader>
        <CardContent>
          <div className="text-xs space-y-1 font-mono text-muted-foreground">
            {[
              "NEXTAUTH_SECRET",
              "META_APP_ID",
              "META_APP_SECRET",
              "META_REDIRECT_URI",
              "DATABASE_URL",
              "BLOB_READ_WRITE_TOKEN",
              "GEMINI_API_KEY",
              "CRON_SECRET",
            ].map((key) => (
              <p key={key}>{key}</p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
