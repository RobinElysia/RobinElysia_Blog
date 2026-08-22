-- ============================================================
-- 0001-brand-rezenki.sql — 品牌改回 ReZenKi（ReZen And KiKi，两个人）
-- 对应：README/CHANGELOG [Unreleased] "品牌全项目改回 ReZenKi"
-- 内容：snapshot 帖（hello-robinelysia → hello-rezenki）+ 其评论正文
-- 执行方式（本地/线上同）：
--   psql "$DATABASE_URL" -f .claude/releases/migrations/0001-brand-rezenki.sql
-- 线上：在部署服务器上对生产库执行（或容器内：
--   docker compose exec db psql -U $POSTGRES_USER -d $POSTGRES_DB -f - < 本文件）
-- 幂等性：按新旧两个 slug 定位（线上若已曾改名为 hello-robinelysia、本地若仍是 hello-rezenki
-- 均可命中），重复执行无害（再次执行时 0 行受影响）。
-- ============================================================

UPDATE posts
SET slug       = 'hello-rezenki',
    cover_image = '/archive/hello-rezenki-wellcome-V0049797.jpg',
    title      = '你好，ReZenKi',
    content    = E'# 你好，ReZenKi\n\n**ReZenKi** 由 *ReZen* 与 *KiKi* 两个人组成。\n\n## 名字的含义\n\n- **ReZen**：克制的禅意——黑白、留白、杂志式的排版\n- **KiKi**：陪伴的伙伴——写下每一篇的冲动\n\n## 风格\n\n这个博客采用黑白简约杂志风格：无彩色强调、大量留白、意大利花体标题。\n\n> 写作本身是克制，展示也是。\n\n<Callout type="tip">\n  这是 MDX 自定义组件示例：代码块可以用黑白灰高亮。\n</Callout>\n\n```ts\nconst motto = "Less is more";\n\nfunction greet(name: string): string {\n  // 注释是灰的，关键字是深黑的\n  return `Hello, ${name}`;\n}\n```\n\n欢迎来到这里。'
WHERE slug IN ('hello-robinelysia', 'hello-rezenki');

UPDATE comments
SET author_name = 'KiKi',
    content     = '第一篇评论！欢迎来到 ReZenKi。'
WHERE post_id = (SELECT id FROM posts WHERE slug = 'hello-rezenki');
