import { NextResponse } from "next/server";
import { getImageById } from "@/lib/images";

/**
 * GET /api/images/[id] —— 文章图片服务（公开，可缓存）
 * 图片不可变 → 永久缓存
 */
export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const image = await getImageById(Number(id));
  if (!image) {
    return NextResponse.json({ error: "图片不存在" }, { status: 404 });
  }

  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(image.size),
    },
  });
}
