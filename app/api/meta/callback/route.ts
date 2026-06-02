import { db } from "@/lib/db";
import { settings } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getLongLivedToken, getIgUserId } from "@/lib/meta";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/settings?error=oauth_denied", req.url));
  }

  // short-lived token 교환
  const tokenRes = await fetch("https://graph.facebook.com/v21.0/oauth/access_token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: process.env.META_APP_ID!,
      client_secret: process.env.META_APP_SECRET!,
      redirect_uri: process.env.META_REDIRECT_URI!,
      code,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return NextResponse.redirect(new URL("/settings?error=token_exchange", req.url));
  }

  // long-lived token으로 교환
  const { token, expiresAt } = await getLongLivedToken(tokenData.access_token);
  const igUserId = await getIgUserId(token);

  await db
    .insert(settings)
    .values({ id: 1, igUserId, accessToken: token, tokenExpiresAt: expiresAt })
    .onConflictDoUpdate({
      target: settings.id,
      set: { igUserId, accessToken: token, tokenExpiresAt: expiresAt, updatedAt: new Date() },
    });

  return NextResponse.redirect(new URL("/settings?connected=1", req.url));
}
