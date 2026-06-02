import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function generateCaption(
  existingCaptions: string[],
  context: string
): Promise<string> {
  const samples = existingCaptions.slice(0, 20).join("\n---\n");
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: `너는 인스타툰 작가의 글쓰기 도우미야.
아래는 이 작가가 지금까지 올린 인스타그램 게시물 캡션 샘플이야.
동일한 말투, 이모지 사용 패턴, 해시태그 스타일로 새 캡션을 작성해줘.
샘플이 없으면 자연스럽고 친근한 한국어로 써줘.
캡션만 출력하고, 부가 설명은 하지 마.

---캡션 샘플---
${samples || "(샘플 없음)"}`,
    messages: [
      {
        role: "user",
        content: `이번 화 내용: ${context}`,
      },
    ],
  });
  const block = msg.content[0];
  return block.type === "text" ? block.text.trim() : "";
}

export async function generateReply(
  commentText: string,
  commenterUsername: string,
  existingCaptions: string[]
): Promise<string> {
  const samples = existingCaptions.slice(0, 10).join("\n---\n");
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 256,
    system: `너는 인스타툰 작가 본인이야.
팔로워 댓글에 자연스럽고 친근하게 대댓글을 달아줘.
아래 캡션 샘플에서 작가의 말투와 이모지 스타일을 참고해.
짧고 따뜻하게, 대댓글 텍스트만 출력해.

---캡션 샘플---
${samples || "(샘플 없음)"}`,
    messages: [
      {
        role: "user",
        content: `@${commenterUsername} 님의 댓글: "${commentText}"`,
      },
    ],
  });
  const block = msg.content[0];
  return block.type === "text" ? block.text.trim() : "";
}
