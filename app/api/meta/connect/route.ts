import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: process.env.META_REDIRECT_URI!,
    scope: [
      "instagram_basic",
      "instagram_content_publish",
      "instagram_manage_comments",
      "pages_show_list",
      "pages_read_engagement",
    ].join(","),
    response_type: "code",
  });

  const url = `https://www.facebook.com/v21.0/dialog/oauth?${params}`;
  return NextResponse.redirect(url);
}
