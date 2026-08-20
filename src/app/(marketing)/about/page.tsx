import type { Metadata } from "next";
import { FadeIn } from "@/components/motion/fade-in";

export const metadata: Metadata = {
  title: "关于",
  description: "关于 RobinElysia（Robin And Elysia）",
};

/**
 * /about 关于页 —— 品牌故事 + 博客定位
 */
export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16 md:px-8 md:py-20">
      <FadeIn>
        <h1 className="mb-10 text-xs font-medium tracking-[0.25em] text-muted uppercase">关于</h1>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="max-w-3xl space-y-8">
          <section>
            <h2 className="font-script text-5xl leading-none">RobinElysia</h2>
            <p className="mt-2 text-xs tracking-[0.35em] text-muted uppercase">
              Robin And Elysia
            </p>
            <p className="mt-6 text-base leading-7 text-muted">
              RobinElysia 由姓氏 Robin 与名字 Elysia 组成：Elysia
              代表美好、梦幻的天堂；Robin 是象征美好寓意的名字前缀。
              这里是个人博客，记录技术、设计与生活的思考。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">这个博客</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
              <li>黑白简约杂志风格，无彩色强调——克制即表达</li>
              <li>自建评论系统（PostGre 存储，提交即显示）</li>
              <li>
                RSS 订阅：
                <a href="/feed.xml" className="text-ink underline">
                  /feed.xml
                </a>
              </li>
              <li>技术栈：Next.js 16 · PostgreSQL · Drizzle ORM</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">写作主题</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
              <li>前端与全栈工程实践</li>
              <li>架构决策与踩坑记录</li>
              <li>设计与审美的思考</li>
            </ul>
          </section>
        </div>
      </FadeIn>
    </main>
  );
}
