import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { fetchArchiveCandidates } from "@/lib/archive-source";
import { checkRateLimit, sweepRateLimits } from "@/lib/rate-limit";

/**
 * POST /api/archive-candidates —— 编辑器档案图候选（v0.22.0）
 * - 鉴权：仅 admin（auth() 检查）
 * - 请求体：{ query?: string } 关键词缺省时主题池随机
 * - 响应：{ candidates: [{ id, url, title, creator, date, source, sourceUrl, license }] }
 * - 候选图已下载入库（images 表 kind='cover'），url 为 /api/images/{id}
 * - 防刷：60s 窗口 5 次（外呼上游 API，需限制频率）
 */
export const runtime = "nodejs";

const bodySchema = z.object({
  query: z.string().trim().max(100).optional(),
});

export async function POST(req: Request) {
  // 鉴权
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  // 防刷（进程内存，多实例部署失效——与本项目其余限流一致，见 tech-debt）
  sweepRateLimits();
  if (!checkRateLimit("archive-candidates", 5)) {
    return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
  }

  // 请求体校验
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "请求参数不合法" },
      { status: 400 },
    );
  }

  try {
    const candidates = await fetchArchiveCandidates(parsed.data.query);
    return NextResponse.json({ candidates });
  } catch (err) {
    // 上游 Wellcome 不可用 → 502，编辑器展示错误信息，不让页面炸掉
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "档案图服务暂不可用" },
      { status: 502 },
    );
  }
}
