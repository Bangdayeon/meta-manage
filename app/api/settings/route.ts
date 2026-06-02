import { auth } from "@/auth";
import { db } from "@/lib/db";
import { settings } from "@/lib/schema";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  postingIntervalDays: z.number().int().min(1).max(30),
  defaultHour: z.number().int().min(0).max(23),
  defaultMinute: z.number().int().min(0).max(59),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await db
    .insert(settings)
    .values({ id: 1, ...parsed.data })
    .onConflictDoUpdate({
      target: settings.id,
      set: { ...parsed.data, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}
