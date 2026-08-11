import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { images } from "@/lib/schema";
import { auth } from "@/lib/auth";

/**
 * POST /api/upload-image —— 文章图片上传（v0.18.0）
 * 方案：PostGre BYTEA 存储（正文引用 /api/images/{id}）
 * - 鉴权：仅 admin（auth() 检查）
 * - 类型白名单：jpeg / png / webp / gif
 * - 大小限制：≤ 5MB
 */
export const runtime = "nodejs";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  // 鉴权
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "缺少 image 文件字段" }, { status: 400 });
  }

  // 类型白名单
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: `不支持的图片类型：${file.type || "未知"}（仅 jpeg/png/webp/gif）` },
      { status: 415 },
    );
  }

  // 大小限制
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "图片超过 5MB 限制" }, { status: 413 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "空文件" }, { status: 400 });
  }

  // 写入数据库
  const buffer = Buffer.from(await file.arrayBuffer());
  const [row] = await db
    .insert(images)
    .values({
      data: buffer,
      mimeType: file.type,
      size: buffer.length,
    })
    .returning({ id: images.id });

  return NextResponse.json({ url: `/api/images/${row.id}` });
}
