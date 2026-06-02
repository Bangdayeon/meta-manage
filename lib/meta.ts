const GRAPH_URL = "https://graph.facebook.com/v21.0";

async function graphFetch(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {}
) {
  const { params, ...fetchOptions } = options;
  const url = new URL(`${GRAPH_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), fetchOptions);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

export async function getIgUserId(pageAccessToken: string): Promise<string> {
  const data = await graphFetch("/me/accounts", {
    params: { access_token: pageAccessToken, fields: "instagram_business_account" },
  });
  const page = data.data?.[0];
  if (!page?.instagram_business_account?.id) {
    throw new Error("연결된 Instagram Business 계정을 찾을 수 없어요.");
  }
  return page.instagram_business_account.id;
}

export async function getLongLivedToken(shortToken: string): Promise<{ token: string; expiresAt: Date }> {
  const data = await graphFetch("/oauth/access_token", {
    params: {
      grant_type: "fb_exchange_token",
      client_id: process.env.META_APP_ID!,
      client_secret: process.env.META_APP_SECRET!,
      fb_exchange_token: shortToken,
    },
  });
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);
  return { token: data.access_token, expiresAt };
}

export async function refreshToken(token: string): Promise<{ token: string; expiresAt: Date }> {
  return getLongLivedToken(token);
}

export async function getRecentCaptions(igUserId: string, token: string): Promise<string[]> {
  const data = await graphFetch(`/${igUserId}/media`, {
    params: { fields: "caption", limit: "20", access_token: token },
  });
  return (data.data ?? [])
    .map((p: { caption?: string }) => p.caption)
    .filter(Boolean) as string[];
}

export async function publishImage(
  igUserId: string,
  token: string,
  imageUrl: string,
  caption: string
): Promise<string> {
  const container = await graphFetch(`/${igUserId}/media`, {
    method: "POST",
    params: { image_url: imageUrl, caption, access_token: token },
  });
  const result = await graphFetch(`/${igUserId}/media_publish`, {
    method: "POST",
    params: { creation_id: container.id, access_token: token },
  });
  return result.id;
}

export async function publishReel(
  igUserId: string,
  token: string,
  videoUrl: string,
  caption: string
): Promise<string> {
  const container = await graphFetch(`/${igUserId}/media`, {
    method: "POST",
    params: {
      media_type: "REELS",
      video_url: videoUrl,
      caption,
      access_token: token,
    },
  });

  // 릴스 업로드 완료 폴링 (최대 2분)
  for (let i = 0; i < 24; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const status = await graphFetch(`/${container.id}`, {
      params: { fields: "status_code", access_token: token },
    });
    if (status.status_code === "FINISHED") break;
    if (status.status_code === "ERROR") throw new Error("릴스 업로드 실패");
  }

  const result = await graphFetch(`/${igUserId}/media_publish`, {
    method: "POST",
    params: { creation_id: container.id, access_token: token },
  });
  return result.id;
}

export async function getNewComments(
  igUserId: string,
  token: string,
  since: Date
): Promise<Array<{
  id: string;
  text: string;
  username: string;
  mediaId: string;
  timestamp: string;
}>> {
  const media = await graphFetch(`/${igUserId}/media`, {
    params: { fields: "id", limit: "10", access_token: token },
  });
  const results = [];
  for (const post of media.data ?? []) {
    const comments = await graphFetch(`/${post.id}/comments`, {
      params: {
        fields: "id,text,username,timestamp",
        since: Math.floor(since.getTime() / 1000).toString(),
        access_token: token,
      },
    });
    for (const c of comments.data ?? []) {
      results.push({ id: c.id, text: c.text, username: c.username, mediaId: post.id, timestamp: c.timestamp });
    }
  }
  return results;
}

export async function postReply(commentId: string, token: string, message: string): Promise<void> {
  await graphFetch(`/${commentId}/replies`, {
    method: "POST",
    params: { message, access_token: token },
  });
}
