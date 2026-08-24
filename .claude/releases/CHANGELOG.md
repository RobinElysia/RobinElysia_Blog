---
status: stable
owner: releases
last-updated: 2026-08-22
---

# 版本变更日志

## [Unreleased] — 2026-08-22

### Added
- **音乐播放页（用户要求）**：导航栏 Disc3 图标点击 → **圆环径向开屏**——音乐页是根布局**全屏 overlay**（非路由，旧页面保持挂载），以图标为圆心 `clip-path: circle()` 半径向外扩张（0.65s），圆内逐步露出音乐页内容、旧页面在圆外可见，直至覆盖全屏；**再点同一图标**同一圆反向缩小收回，回到上一页原样（滚动位置保留）；1px line 圆环边界随半径同步。overlay 内容图录风格——正在播放区（编号 + 衬线曲名 + 作者小字宽字距 + 墨线进度点击跳转 + 播放/暂停/上一首/下一首/静音）+ 全部曲目目录（目录号/曲名/作者/时长/播放中墨点）；**全局唯一 `<audio>`**（根布局 `MusicAudio` context，跨页播放不中断，ended 自动切下一首循环）；键盘 Space 播放/暂停、←/→ 切曲、Esc 关闭；reduced-motion 跳过动画直接切换；曲目静态映射 `src/lib/music.ts`（10 首，ffprobe 实测时长）；mp3 在 `public/music/`


### Added
- **友链页（用户要求，先静态后动画）**：`/links` 页面 + 导航栏「友链」字段；数据 `src/lib/friends.ts`（9 位友站，静态不动 DB，SSG）；卡片含头像（远程源 unoptimized 直连 + 首字母占位兜底）/描述/tag 徽章；无链接条目渲染「链接待补充」卡片；tag 三色为站长指定例外色（DESIGN.md §2 例外条款，`--color-friend-*` 亮/暗两套）
- **编辑器档案图候选（用户要求，ADR-0006）**：编辑页「获取 3 张」直连 Wellcome API（免 key）检索公共领域藏品 → license 白名单过滤 + 站内已用 work id 去重 → 下载 3 张入 PostGre（images 表 kind='cover' + 元数据列）→ 点选 1 张绑定封面；保存时服务端生成 `posts.cover_credit` 署名行，PostCard/CardInfo 优先展示；未选中候选 24h 孤儿清扫
- **浮动底栏（用户要求）**：文章/归档/关于/友链页（含文章详情）的页脚改为固定视口底部的浮动底栏——**下滚出现、上滚隐藏**（fade + 16px，0.35s，easeOutQuint；reduced-motion 降级），顶部恒隐、底部恒显、内容短于一屏恒显；首页/登录/Dashboard/404 保持静态页脚不变
- 迁移 `0002_overconfident_gamma_corps`：images + kind/source_id/元数据 7 列；posts + cover_credit
- `src/lib/archive-source.test.ts`：14 个纯函数单测（URL 构造/license 白名单/主题池/命中过滤）
- `eslint-plugin-react` 显式声明为 devDependency（`react/jsx-no-leaked-render` 依赖它；pnpm 严格模式不提升传递依赖，eslint.config.mjs 显式注册修复解析失败）

### Changed
- **线上封面图碎图修复**（品牌改名后生产库残留旧文件名）：`0001-brand-rezenki.sql` 增补路径级 `REPLACE`（任何 `cover_image` 残留 `hello-robinelysia` → `hello-rezenki`，不依赖 slug——覆盖管理员改过标题/slug 的帖子）；`public/archive/` 保留旧文件名兼容副本，未执行迁移的库也不会再碎图
- **Docker 依赖安装韧性修复**（服务器慢网络实测 `pnpm install` 超时失败）：`pnpm install` 改 CLI 强制 `--fetch-timeout=600000`/`--fetch-retries=5`/`--network-concurrency=4`（.npmrc 的 fetch-timeout 在 pnpm 11 慢网络下并非总生效——60s 默认超时在 next/mermaid/katex 等大包上必中）；install 失败自动重试至多 3 次，pnpm store 同层保留只补缺失大包；镜像源可配 `PROD_NPM_REGISTRY`（compose build arg，默认 npmmirror，海外可换 registry.npmjs.org）；DEPLOY.md 生产域名更新 meowin.asia
- **品牌全项目改回 ReZenKi（用户要求，镜像 0.21.0 改名）**：全称更新为 **ReZen And KiKi**——ReZen 与 KiKi 两个人（废弃 RefrainZen 表述）；34+ 文件替换——UI 文案/metadata/RSS/JSON-LD/about/登录/落款/手写 intro、代码注释、.claude 文档、DEPLOY/README/REASONIX/DESIGN/Caddyfile/Dockerfile/compose；名字含义文案重写（两个人 ReZen 与 KiKi，撤掉把名字当概念的附会）——about 页、seed 模板、DB 正文同步；`hello-robinelysia` → `hello-rezenki`（slug、档案图文件 git mv、archive-images 键、e2e 断言）；`robinElysiaCodeTheme` → `rezenkiCodeTheme`（shiki 主题名同步）；花体 6 字符长度适配：Hero clamp 响应式字号、header text-2xl、login text-5xl、intro/colophon SVG viewBox 980→640 收窄；`.env` `PROD_ADMIN_USERNAME=RobinElysia → ReZenKi`（GitHub 白名单保留——账号标识，与品牌无关）；DB 迁移脚本 `releases/migrations/0001-brand-rezenki.sql`（本地已执行，线上按 DEPLOY.md 部署时同步）
- **Harness 自洽性修复**（详见 0011 报告）：`AGENTS.md` / `runtime-and-deployment.md` 内容存储断言与代码对齐（PostgreSQL `posts` 表存 Markdown 原文，删除过时的 src/content 断言）；`loop-protocol.md` 工具名补 harness 通用等价名；`auto-cleanup.md` 补 ts-prune/depcheck 误报例外；`seed.ts` 历史叙述去 `src/content/` 路径
- `ts-prune@0.10.3` + `depcheck@1.4.7` 落地 devDependencies（auto-cleanup 清单 1/2 工具），登记 tech-radar
- `scripts/harness-check.mjs` 新增"内容存储断言漂移"门禁检查（`MDX 文件…src/content/` 正面断言 = 漂移，豁免 releases/ADR/脚本自身）
- DESIGN.md §4 补"编辑器内置取图"小节（选图准则/署名格式/技术约束对编辑器管线同样生效）

## [0.21.3] — 2026-08-20

### Removed
- **3D 水波纹 Hero 删除**（用户否决"有点屎"）：`wave-ocean.tsx`、three / @types/three 依赖一并移除——"数字生成物与档案气质张力"悬置项结案

### Added
- **档案图视差舞台 Hero**（用户规格）：全屏固定舞台——超大衬线主标题 RobinElysia（两行 overflow-hidden + translateY(110%) 入场，行间 0.12s，无弹跳）+ 伊甸园蚀刻主图（Wellcome V0034166，MCP 取图，本站未重复使用，multiply 融入纸面）+ 底部 "SCROLL TO EXPLORE" 细线提示
- **散落图集**（用户反馈"一张太单调"）：6 张 Wellcome 蚀刻（本草/哥白尼天文/解剖/几何仪器/望远镜/医神，MCP 取图避开站内已用）像收藏品散落第一页各处——首屏固定 4 张（大小不一 + 轻微旋转 + 纸片卡），向下滚动（Hero 滚出进度 0.22/0.34 错峰）再浮现 2 张，直到进入"最近"章；整层随背景视差 ±8/6
- **鼠标惯性视差**：normalized -1..1 + lerp 0.06——背景 ±8/6 · 主图 ±18/12（rotateY ±1.5°/rotateX ±1°）· 主图内层反向 ±6/4（景深）· 前景标题 ±28/20；鼠标离开平滑回中心；rAF 循环**收敛即停**（R5 纪律）；reduced-motion 全归零
- 滚出衔接保留：整台随共享滚动源渐出上移，无缝进入逐卡翻页

### Changed
- e2e：canvas 断言 → 视差舞台断言（主图/SCROLL 提示）；motion-and-interaction/DESIGN 文档同步（R5 改写为动效性能纪律）

## [0.21.2] — 2026-08-20

### Changed
- **品牌全项目改名 ReZenKi → RobinElysia**（用户要求）：36 文件 107+ 处替换——UI 文案、metadata、RSS、JSON-LD、about/登录/落款/手写 intro（SVG 加宽 640→980）、代码注释、.claude 文档、DEPLOY/README/REASONIX/DESIGN
- 品牌全称 **RefrainZen And KiKi → Robin And Elysia**；名字含义文案重写（Elysia = 美好、梦幻的天堂；Robin = 象征美好寓意的名字前缀）——about 页、seed 模板、DB 正文同步更新
- **hello-rezenki → hello-robinelysia**：slug（DB 更新 + e2e）、档案图文件重命名、archive-images 映射键；`rezenkiCodeTheme` → `robinElysiaCodeTheme`（shiki 主题名同步）
- 环境与基建：`PROD_ADMIN_USERNAME=ReZenKi → RobinElysia`（.env）；本地容器 `rezenki-postgres` 重命名 `robinelysia-postgres`
- 花体长度适配（11 字符）：Hero 标题 clamp 响应式字号、header logo text-xl、login h1 text-4xl、intro/colophon SVG viewBox 加宽

## [0.21.1] — 2026-08-20

### Added
- **Caddy 内置 Docker 部署（用户要求，处理 SSL）**：`Caddyfile` + compose 第三服务（caddy:2-alpine，80/443）；**自动 HTTPS**——生产域名自动 Let's Encrypt 签发/续期（caddy_data 卷持久化）、HTTP→HTTPS 308 重定向、HSTS；域名 `PROD_DOMAIN` 注入，本地测试留空走 localhost 自签，端口 `PROD_HTTP_PORT`/`PROD_HTTPS_PORT` 可覆盖避开冲突
- app 不再暴露宿主机端口（compose 内网由 Caddy 访问）；`.env.example` 补 PROD_* 生产段（含 PROD_DOMAIN）

### Changed
- **Dockerfile runner 改 `pnpm install --prod`**（仅生产依赖）——实测放弃 `output: standalone`：Next 16 对 pnpm peer-suffix 目录（`drizzle-orm@…_@types+pg…` 等）追踪失效漏包，且 standalone 与 `next start` 互斥
- **DEPLOY.md 重写**：Caddy 自动 HTTPS（原 Nginx+certbot 段落替换）、内嵌 compose/Caddyfile/.env 三件套、故障排查表补 2 条（pgdata 旧卷密码不匹配；首页 unstable_cache 5 分钟缓存）
- 本地实测闭环：build → compose up → 迁移自动执行 → 导入真实数据 → HTTPS 200（文章/档案/登录/RSS 全链路）+ 308 重定向 + 自签证书签发

## [0.21.0] — 2026-08-20

### Added
- **章节式长滚动叙事首页**（用户要求）：线性纵向四章——Ch.00 序（3D 波浪 Hero，原样保留）→ Ch.01 最近（逐卡翻页，原样保留）→ Ch.02 档案（年份分组时间轴）→ Ch.03 落款；右侧竖向章节导航（`nav`/`button`/`aria-current`，键盘可达，点击平滑跳转）
- **档案图落地**（用户指定 archival-imagery-mcp）：4 张 Wellcome 公共领域藏品图（蚀刻/星图/印刷机/天文图）落盘 `public/archive/`，`src/lib/archive-images.ts` slug→元数据映射，PostCard 改 next/image + 署名元数据（元数据即排版元素）

### Changed
- **暖纸五色 token + EB Garamond 落地**：globals.css 五色（chroma ≤ 0.015，双模式）、layout.tsx EB_Garamond（--font-serif + 中文衬线回退）、UI 控件/表单/Dashboard 保持系统栈；shiki/code-theme 暖纸化
- **DESIGN.md 决策反转**：§1「不借鉴滚动叙事」→ 有条件采纳（章节幕叙事 + 竖向进度条；禁环形 3D 轮播与叠层，引 v0.8.1/v0.11.1 回滚根因）；§5 首页结构重写；§8 待办补 4 项
- **首页滚动架构**：单一滚动源（rAF 节流 + IntersectionObserver，替代每卡 listener + getBoundingClientRect）；`--header-h` 变量消除 57px 魔法数；hero-content 滚出动画改用共享源（原 window 监听在局部容器下从未生效）
- **motion-and-interaction.md**：新增叙事转场例外区（白名单 src/components/home/**）；回滚根因 R1/R2/R3 固化落档
- **滚动驱动动效（档案/落款章）**：档案章题→年份头→文章依次从左滑入（stagger）+ 滚向落款时整章向视口中心收缩淡出；落款签名式入场（花体签名落笔回正 → 墨线展开 → 文字行浮现），双向可逆 + reduced-motion 降级
- **转场节奏调优（用户反馈）**：wheel 平滑翻页接管 2s（easeInOut + 中断阈值，替代 snap-mandatory 顿挫）；卡片/档案动效去 spring 改纯函数缓动（跟手零滞后）；卡片入场幅度对齐出场（75px → **+920px/+10° 右下 45° 滑入**，与 -920px/-10° 对称）；档案帖子改**从右往左滑入、退场原路返回**；落款 RobinElysia 改 **SVG 手写描画**（draw-stroke 2.4s + 墨色渐入）；档案/落款章配 Wellcome 蚀刻局部背景（multiply 水印）；three 波浪渲染循环加可见性暂停（Hero 滚出即停，修转场卡顿）
- **Dashboard**：移动端顶部导航（修复 md 以下无导航）；统计卡响应式 grid
- site-header 滚动解耦（去全局 capture hack，订阅共享源）

### Fixed
- D1 token 基线断裂、D2 随机风景图、D3 每卡 scroll listener 重排、D4 reduced-motion 对 JS 动效失效、D5 魔法数、D6 无滚动位置指示、D8 滚动 hack、D9 移动端无导航、D10 统计卡无响应式、D11 动效规范失效（详见 0010 报告）
- **R4 motion 数字源陷阱（dev 验收反馈补丁）**：`useSpring(number)`/无源 `useTransform(() => n)` 不追踪后续变化，首页卡片 opacity 恒 0（图片"网络正常但看不见"）——改 `useMotionValue` + effect `mv.set()` 源同步（scene-carousel/hero-content）；手写进入动画放慢（描画 1.6s → 2.8s）

## [0.20.0] — 2026-08-20

### Changed
- **Harness 文档体系与代码同步**（审查报告 0009，review-snapshot）：
  - 全库路径 `.harness` → `.claude`（32 文件 101 处，含 AGENTS/CLAUDE/REASONIX/README/.env.example/源码注释）
  - 评论流文档回填：无审核流（v0.7.0 起提交即 approved）+ IP 限流 + 无内容审核风险标注
  - 缓存 tag 统一 `post-list`（全站粒度，粗粒度有意取舍）；带参查询函数内嵌模式入文档
  - 路由树按实测重画（无 middleware/settings/loading.tsx；鉴权在 (dashboard)/layout.tsx）
  - 环境变量表 10 行对齐 .env.example（含 `AUTH_GITHUB_ALLOWED_USERS` 空=拒绝全部）
  - 全库命令 pnpm 化（loop-engine/测试文档/PR 模板/README/playwright webServer）
  - eslint.config.mjs 落地 5 条规则（no-console error、no-unused-vars error、no-explicit-any error、explicit-function-return-type warn、jsx-no-leaked-render warn），`pnpm lint` 0 error
  - package.json 增 `test:e2e` script；测试数字统一 30 单测 / 6 E2E
  - REASONIX 状态枚举补 `review-snapshot`；8 篇审查报告 frontmatter 统一
  - tech-radar 去矛盾补 7 项；roadmap 收敛（评论反垃圾风险项 + 优先级重排）
  - onboarding 结构图 / README 按实测重画（无 src/content、无 REVIEW-REPORT.md）
  - design 最小事实修正（用户授权）：Giscus→自研评论、token 示例对齐、场景化结论按代码事实记录
  - 技术债务登记：设计定稿（暖纸五色+EB Garamond）未落地代码
- 验证：build ✅ / typecheck ✅ / lint 0 error ✅ / test 30/30 ✅；`.harness` 残留 0；无孤儿文档
- 圆桌修订（用户批准）：`scripts/harness-check.mjs` 防漂移门禁 + CI job + `pnpm harness:check`；REASONIX 文档分层（契约层/叙事层）；`.github/PULL_REQUEST_TEMPLATE.md`；`pnpm format` 全库收敛 + CI format:check；DESIGN.md / visual-style-guide.md 加 `implementation-status: pending` 标记 + globals.css/layout.tsx 迁移注释；评论治理 MVP 经用户否决维持 roadmap 风险项

## [0.19.14] — 2025-07-11

### Fixed
- **CI lint 修复（GitHub Actions 报错）**——3 error + 5 warning 全部清零：
  - `react-hooks/set-state-in-effect` ×2：post-card 图片 URL 水合刷新改用 `useSyncExternalStore`（官方 hydration 安全模式）；site-header 主题同步改为 useSyncExternalStore + MutationObserver 监听 html class
  - `no-explicit-any`：mdx-components 类型改为 `ComponentType<Record<string, unknown>>`
  - warnings：删未用 import/变量（eq、Texture、beforeEach）、error.tsx 不再解构 error
- 验证：eslint 0 问题、build ✅、单测 30/30 ✅、E2E 6/6 ✅

## [0.19.13] — 2025-07-11

### Fixed
- **GitHub 登录 Access Denied（白名单拒绝）**：NextAuth GitHub provider 默认 `user.name` = GitHub **显示名**（profile.name），而非用户名（login）——显示名≠`RobinElysia` 时白名单匹配失败。修复：自定义 profile 映射，name 强制用 `profile.login`（用户名）。

## [0.19.12] — 2025-07-11

### Fixed
- **Dashboard 数据库报错复发（SASL: client password must be a string）**：上一轮去 BOM 时发现更深层损坏——PowerShell `Set-Content` 用 GBK 读 UTF-8 文件导致中文注释乱码，**乱码字节吞掉换行符**，`DATABASE_URL` 被并进 `#` 注释行（dotenv 整行忽略）。已用 node 重写干净的 UTF-8 `.env.local`（无 BOM、无乱码）。验证：dotenv 加载正常 + 数据库查询 5 篇 ✅
- **教训（写入 conventions）**：改环境变量一律用 node/VS Code（UTF-8 无 BOM），严禁 PowerShell `Set-Content`（GBK 读取 + BOM 写入双重损坏）

## [0.19.11] — 2025-07-11

### Fixed
- **Dashboard 数据库全部报错（SASL: client password must be a string）**：根因是 PowerShell `Set-Content -Encoding UTF8` 把 `.env.local`/`.env` 写成 **UTF-8 BOM**——Next.js dotenv 解析失败（日志 `injected env (0)`），`DATABASE_URL` 未注入。已用 node 去除 BOM 重写（注意：以后改环境变量用文本编辑器，不要用 PowerShell Set-Content；或改用 `node -e` 写文件）

## [0.19.10] — 2025-07-11

### Added
- **GitHub 登录白名单**（用户安全要求：只有配置的人能进 Dashboard，别来个人就能登）
  - `auth-allowlist.ts`：`AUTH_GITHUB_ALLOWED_USERS`（逗号分隔用户名/邮箱，大小写不敏感）；**列表为空 → 拒绝所有 GitHub 登录**（安全默认）
  - `auth.ts` 的 signIn 回调：GitHub provider 登录必须命中白名单；Credentials 不受限
  - compose 增加 `AUTH_GITHUB_ALLOWED_USERS` 映射（PROD_ 前缀）；.env.local/.env/.env.example 已配置
  - 6 个单测覆盖（空列表/命中/大小写/邮箱/拒绝/空格容忍）——30/30 通过

## [0.19.9] — 2025-07-11

### Changed
- **Docker 配置注入重构（PROD_* 前缀）**——排查出本机 compose 读不到 .env 新值的两层根因：
  1. **终端会话残留环境变量**（`ADMIN_PASSWORD=robinelysia-admin` 等旧值）——compose 插值优先读 shell 环境，压过 .env 文件
  2. Docker Desktop compose v2.29.2-desktop.2 的 `env_file` 失效（两种语法均不注入容器）
  - 修复：environment 插值改用 `PROD_*` 前缀变量名（与任何 shell 残留不冲突，值始终来自 .env）
  - 验证：`docker compose config` 全部展开正确 ✅、db 容器实测注入 `POSTGRES_PASSWORD=***` ✅
  - DEPLOY.md 同步更新（PROD_* 模板 + 说明）
- **生产配置已填入**：SITE_URL=https://meowin.asia、AUTH_SECRET、ADMIN=RobinElysia/***、POSTGRES=***、GitHub 生产凭证

## [0.19.8] — 2025-07-11

### Changed
- **登录页 GitHub 按钮改为服务端运行时判断**：移除 `NEXT_PUBLIC_GITHUB_LOGIN`（构建时内联，Docker 部署无法随运行时 .env 变化）——login 页拆为 server wrapper（读 `AUTH_GITHUB_ID/SECRET` 是否存在）+ client `LoginForm`（接收 prop）。换生产凭证/加凭证无需重建镜像
- 生产 `.env` 模板更新：填入生产 GitHub 凭证（`Ov23liNtt...`），标注部署时必改项（SITE_URL/AUTH_SECRET/密码）

## [0.19.7] — 2025-07-11

### Changed
- **GitHub OAuth 切换到开发环境凭证**（用户提供 dev App ID/Secret）：`.env.local` 更新为 dev 凭证（之前填的是生产环境的）。验证：按钮 ✅、跳转 client_id=Ov23li2y7... ✅

## [0.19.6] — 2025-07-11

### Added
- **GitHub OAuth 配置完成**（用户提供 ID + Secret）：写入 .env.local，登录页显示 GitHub 按钮。验证：按钮显示 ✅、点击跳转 github.com 且 client_id 正确 ✅

## [0.19.5] — 2025-07-11

### Fixed
- **GitHub 无法登录**：根因是 `.env.local` 未配置 `AUTH_GITHUB_ID`/`AUTH_GITHUB_SECRET`（GitHub provider 无凭证，点击登录跳转必然失败）
  - 健壮性改进：未配置凭证时**不注册 GitHub provider** + 登录页**不显示 GitHub 按钮**（`NEXT_PUBLIC_GITHUB_LOGIN` 控制），避免"按钮点了报错"的困惑
  - 配置后：填 .env.local → 重启 dev server → `NEXT_PUBLIC_GITHUB_LOGIN=true`

## [0.19.4] — 2025-07-11

### Fixed
- **"Encountered a script tag" 警告（最终方案）**：三次尝试（内联 script → next/script beforeInteractive → 外部 src）均失败——React 19 对 React 渲染的任何 `<script>` 都告警（Next 16 的 beforeInteractive 也会渲染内联脚本 push 队列）。**改为零脚本方案**：主题 class 由 SSR 直接输出——切换主题时写 `theme` cookie（samesite=lax），layout 用 `cookies()` 读取并输出 `<html class="dark|light">`；无 cookie 时 CSS 媒体查询跟随系统。验证：警告消失、cookie=dark reload 保留、跟随系统正常 ✅（删除 public/theme-init.js）
- **中文 slug 文章详情 404**：App Router 动态路由参数对非 ASCII slug 保留 URL 编码 → 查询不匹配。修复：`decodeURIComponent` 统一解码（已解码时无副作用，try/catch 兜底）。验证：`/blog/理性与感性` 200 ✅

## [0.19.3] — 2025-07-11

### Fixed
- **"Encountered a script tag" 警告再次出现**（v0.19.2 的 `next/script beforeInteractive` 在 Next 16 已失效——直接渲染出 script 照样告警）。
  最终方案：防 FOUC 脚本改为**外部静态文件** `public/theme-init.js`，layout 用 `<script src="/theme-init.js" />`——React 19 只对内联 script 告警，外部 script 官方支持（SSR 输出到 head，浏览器解析时同步执行）。
  验证：警告消失 ✅、localStorage=dark → html.dark 正常注入 ✅、脚本 200 ✅

## [0.19.2] — 2025-07-11

### Fixed
- **"Encountered a script tag" 水合警告**：React 19 对 React 渲染的内联 `<script>` 告警且水合时不执行——防 FOUC 脚本改用 `next/script` `beforeInteractive`（hydration 前执行，功能不变）。验证：警告消失、主题 class 正常注入 ✅
- 顺手消除 `THREE.Clock` 弃用警告：wave-ocean 改用 `THREE.Timer`

## [0.19.1] — 2025-07-11

### Fixed
- **全站数据库查询失败（Failed query on posts/comments）**：非代码 bug——Docker Desktop 未运行导致 robinelysia-postgres 容器不可达（ECONNREFUSED 被 DrizzleQueryError 包装）。已重启容器 + 设置 `--restart unless-stopped` 预防复发（Docker Desktop 启动时自动拉起数据库）。
  排查路径记录：Failed query 先查 `docker ps`，容器 Exited/引擎未运行是首要嫌疑。

## [0.19.0] — 2025-07-11

### Added
- **Docker 部署方案**（用户要求部署到服务器）
  - `Dockerfile`：三阶段构建（deps→builder→runner），构建期 AUTH_SECRET 占位、next build 不连库（force-dynamic）
  - `docker-compose.yml`：app + postgres 双服务、healthcheck、pgdata 卷持久化
  - `scripts/migrate.mjs`：容器启动自动迁移（drizzle-orm migrator，production API 无需 drizzle-kit）
  - `.dockerignore`：排除 env/文档/测试
  - `DEPLOY.md`：完整部署指南（镜像推送、服务器安装、HTTPS、运维、备份、排障）
- 验证：镜像构建成功（15 路由）、compose 本地启动全链路 200、迁移自动执行、容器内登录成功

## [0.18.0] — 2025-07-11

### Added
- **编辑器图片粘贴/拖拽上传**（用户要求，PostGre BYTEA 方案——用户确认）
  - `images` 表（id / data bytea / mime_type / size / created_at），customType 实现 bytea（drizzle 0.45 无内置）
  - `POST /api/upload-image`：鉴权（仅 admin）+ 类型白名单（jpeg/png/webp/gif）+ 5MB 限制
  - `GET /api/images/[id]`：公开图片服务，`Cache-Control: public, max-age=31536000, immutable`
  - 编辑器（post-form）：`onPaste` 剪贴板图片 + `onDrop` 拖拽 → 自动上传 → 光标处插入 `![alt](/api/images/{id})`；上传中提示
  - 正文不存 Base64——只存短引用 URL

## [0.17.0] — 2025-07-11

### Changed
- **卡片出入场动画：慢速 + 大幅度**（用户要求）
  - 进度加 **spring 平滑**（stiffness 55 / damping 19）：吸附保持原生快，但转场动画慢速播放（吸附后仍持续 ~800ms 缓动，与吸附解耦）
  - 幅度加大：滚出位移 -760 → **-920px**（45° 更远），进入位移 50 → **75px**，旋转 -8° → **-10°**
- 验证：吸附完成后卡片仍缓慢滑入（top 119 → 81 → 75，~800ms）

## [0.16.1] — 2025-07-11

### Changed
- **卡片吸附恢复原生速度**（用户要求）：移除 SnapController（750ms 慢速吸附），恢复 `snap-y snap-mandatory` 原生快吸附；转场区间恢复 v0.15 节奏（enter [0,1] / exit [0.25,1]）。水波纹慢速惯性保留。

## [0.16.0] — 2025-07-11

### Changed
- **水波纹慢速惯性**（用户要求）：波浪速度系数减半（1.4→0.7 / 1.1→0.55 / 0.8→0.4 / 2.1→1.05），冲击波传播更慢更绵长（衰减 0.35→0.3、生命周期 3.5s→4.5s）
- **卡片吸附与转场慢速化**（用户要求）：
  - 新增 `SnapController`：JS 接管滚动吸附（750ms easeOutCubic 慢速动画，替代原生 snap 快吸附），滚动停止后平滑吸附到最近一页
  - 转场区间拉长（enter 0→0.6 / exit 0.35→1）——45° 进出场更舒缓，与吸附动画同步（吸附过程即转场过程）
  - 移除 `snap-mandatory`（原生快吸附），保留页结构

## [0.15.0] — 2025-07-11

### Fixed
- **逐卡翻页动画彻底修复**（用户要求：一页只展示一个，PPT slide 式，无中间态）
  - 根因 1：滚动容器 `h-full` 父链被内容撑开（scrollHeight == clientHeight，容器不可滚）→ 容器固定 `h-[calc(100dvh-57px)]`
  - 根因 2：卡片页 `h-screen`(720) ≠ 容器(663)，吸附后下一张漏出 → 统一 `calc(100dvh-57px)`
  - 根因 3：**motion `useScroll` 在局部滚动容器中不可靠**（enter 微动、exit 完全不驱动）→ 改为**手动监听滚动容器 + useMotionValue 驱动**（getBoundingClientRect 计算进入/滚出进度，绝对可靠）
  - 根因 4：滚出位移 -70%（425px）不足以移出视口 → 绝对像素 -760px（一屏多）
- **验证（真实滚轮模拟）**：每滚一格**恰好 1 张卡片可见**，上一张完全移出视口（-1402px），无残留、无中间态 ✅
- Hero 文字层改为滚动渐出（hero-content.tsx，滚出时文字淡出上移）

## [0.14.0] — 2025-07-11

### Changed
- **卡片翻页动画与排版重构**（用户要求）
  - 进出场 **45° 对角**：滚出斜向左上 45°（x/y 等量 -70%，rotate -8°），进入从右下 45°（x/y 等量 50→0）
  - 卡片改为 **16:9 比例**纯图卡（`aspect-video`，图片铺满 + 渐变遮罩 + hover 缩放）
  - 文章信息（日期/标题/摘录/标签）移出卡片，显示在**屏幕左下角**（`CardInfo` 组件），滑动时**渐进渐出**（MotionValue 驱动 opacity + 位移）
  - 页签移到右下角（01 / 04）

## [0.13.0] — 2025-07-11

### Changed
- **卡片翻页动画重构**（用户要求）
  - 删除 Scene 3（按次序文章卡片列表）——首页只保留波浪 Hero + 卡片翻页
  - 3D 环形轮播 → **逐卡翻页**：每张卡片占一屏（snap-start），滚动时当前卡片**斜向左上滚出**（x→-70%、y→-30%、rotate→-8°、淡出），下一张**从右下滑入**（x 45%→0、y 20%→0、淡入）
  - **吸附无中间态**：scroll-snap mandatory 保证滚动停止时必然停靠某张卡片（不会停在两张之间）；进出场动画完全由滚动进度驱动

## [0.12.2] — 2025-07-11

### Fixed
- **Hydration mismatch（卡片图片）**：`useState(() => ...Date.now())` 在 SSR 与客户端水合各执行一次，src 时间戳不同导致不匹配。修复：SSR/水合用稳定 URL（slug 作 query），水合后 `useEffect` 再刷新为带时间戳的随机图。验证：无 hydration 错误、console 干净 ✅

## [0.12.1] — 2025-07-11

### Changed
- **卡片随机图片接口更换**：`picapi.pai.al/api` → `picapi.pai.al/api/scenery.php`（风景图源，实测 200/image/png）

## [0.12.0] — 2025-07-11

### Added
- **最新文章大卡片（撑满 3/4 页面：图片 + 标题信息）**
  - `PostCard` 重构：图片区（68% 高度，随机图片接口 `picapi.pai.al/api`，每次请求不同图；失败灰底占位 + referrerPolicy）+ 信息区（32%：日期/标题/摘录/标签/序号）+ hover 图片缩放
- **场景化滚动**（用户要求：场景转换 + 3D 轮播 + 逐字 + 吸附 + 叠层）
  - Scene 2：3D 环形轮播——4 张大卡片（h-[75vh]）rotateY 环绕 + translateZ 480px，滚动驱动旋转 360° + 标题逐字错峰
  - Scene 3：滚动叠层场景转换——每张卡片 sticky 层叠覆盖（zIndex 递减），滚动时逐张替换 + fade/scale 入场
  - 滚动吸附：局部滚动容器 `snap-y snap-mandatory`；header 毛玻璃 capture 监听

## [0.11.1] — 2025-07-11

### Changed
- **首页场景化再次回滚**（v0.11.0 的 3D 轮播/叠层/吸附全部撤销，用户不满意）：删除 home/ 四组件与局部滚动容器，恢复经典布局——**3D 波浪 Hero（v0.10.x 保留项）+ 文章列表**；header 恢复 window 监听；E2E 恢复。
- 结论（`motion-and-interaction.md`）：**场景化首页（多屏 snap/3D 轮播/叠层）两次尝试均被回滚**——用户偏好"波浪 Hero + 向下滚动看文章"的单页流。3D 波浪 Hero 本身被认可保留。

## [0.11.0] — 2025-07-11

### Added
- **首页场景化重建**（用户再次要求：最新文章卡片 + 3D 轮播 + 逐字 + 吸附 + 叠层；保留已认可的 3D 波浪 Hero）
  - **PostCard 卡片组件**（`home/post-card.tsx`）：日期/标题/摘录/标签 + hover 上浮位移——3D 轮播与列表复用
  - **Scene 2 滚动驱动 3D 环形轮播**：最新 6 篇文章卡片环形环绕（rotateY + translateZ 230px），容器随滚动进度旋转 360°，标题逐字错峰入场
  - **Scene 3 滚动叠层转场**：sticky 顶层覆盖前场景 + fade/scale + 条目错峰 + 标题逐字
  - **滚动吸附**：局部滚动容器 `snap-y snap-mandatory`
  - header 毛玻璃恢复 capture 监听（适配局部滚动容器）

## [0.10.3] — 2025-07-11

### Changed
- **全站隐藏滚动条**（用户要求：大气观感）：globals.css 全局 `scrollbar-width: none` + `::-webkit-scrollbar { display: none }`——滚动功能保留，仅视觉隐藏（含局部滚动容器）

## [0.10.2] — 2025-07-11

### Changed
- **水波纹：不透明化 + 水的质感**（用户反馈：不要太透明、要有水的质感）
  - opacity 0.42 → **0.72**（微透，不再透底）
  - roughness 0.28 → **0.06**（水面光滑）+ clearcoat 0.9（湿润光泽）
  - 新增 **PMREM 环境反射贴图**（RoomEnvironment）——波峰随法线变化产生**波光粼粼**的高光（水的核心质感）
  - 颜色：灰 → **淡冷蓝灰**（低饱和水色，浅色主题深水 / 深色主题亮水）

## [0.10.1] — 2025-07-11

### Changed
- **水波纹平滑化 + 毛玻璃透明质感**（用户反馈：不光滑、要毛玻璃透明色）
  - 去掉 `flatShading`（面片棱角感）→ 平滑法线着色
  - 网格细分 110×110 → 160×160（波浪曲线更顺滑）
  - 材质 MeshStandardMaterial → **MeshPhysicalMaterial**：半透明（opacity 0.42）+ 磨砂（roughness 0.28）+ 光泽层（clearcoat 0.5）——毛玻璃质感，背景透出
  - 颜色随主题：浅色主题深灰玻璃 / 深色主题亮灰玻璃（半透明层次由透明度负责）

## [0.10.0] — 2025-07-11

### Added
- **3D 大气水波纹 Hero**（用户要求：3D + 大气，替代简约波纹）
  - Three.js 波浪平面：110×110 网格、多层 sin 大振幅叠加（0.28/0.24/0.18/0.08）、低角度透视相机（42°）、flatShading + 方向光/轮廓光（光影层次）
  - 鼠标划过产生**冲击波**（顶点位移脉冲，指数衰减扩散，上限 8 个）
  - 全屏首屏（h-screen）+ 底部渐变过渡到正文；花体字 `text-8xl/9xl` 大字号
  - 颜色跟随黑白主题（深色主题亮波浪/浅色主题深波浪，对比强烈）
  - three 动态 import（仅 Hero 加载）；reduced-motion 静态渲染
  - 组件 `wave-ocean.tsx`；删除 `fluid-ripple.tsx`（简约波纹被替代）
- 依赖：three + @types/three

## [0.9.1] — 2025-07-11

### Fixed
- **Hero 波纹不显示**：canvas 是 `pointer-events-none`（设计上不挡文字），但事件监听挂在 canvas 自身——收不到任何指针事件。修复：监听 `window` 的 `pointermove` + `getBoundingClientRect` 坐标区域判断（仅 Hero 区域响应），`pointerleave` 挂 document。验证：真实鼠标移动后 canvas 206 个绘制采样点 ✅

## [0.9.0] — 2025-07-11

### Added
- **Hero 背景交互式流体波纹**（用户要求：鼠标划过的波纹，文字高级感）——`fluid-ripple.tsx`（client）
  - 鼠标划过 Hero 区域生成水面涟漪（同心圆扩散 + 衰减），60ms 节流、上限 24 个
  - 单色（读取 `--color-ink`，oklch 亮度映射灰阶，跟随黑白主题切换）
  - 仅背景装饰层（z-0），文字 z-10 在上，不影响可读性
  - reduced-motion 降级（不生成波纹）；pointerleave 清空残留
  - 现有首页结构零改动（Hero 组件内嵌背景层）

## [0.8.1] — 2025-07-11

### Changed
- **首页场景化整体回滚**（用户不满意 v0.8.0 效果）：删除 fluid-hero / scene-carousel / post-scene / home-scenes 四组件与滚动吸附容器，恢复经典首页（花体 Hero 拆字 + 最近文章列表）；header 滚动监听恢复 window 版本；E2E 首页断言恢复。
- `motion-and-interaction.md` 场景化特例节移除，改为"已回滚"结论记录——粒子/3D 透视维持禁用清单。

## [0.8.0] — 2025-07-11

### Added
- **首页场景化改造**（用户要求"高级感"，见 `motion-and-interaction.md` 特例节）
  - Scene 1 **交互式流体扭曲 Hero**：canvas 单色流体粒子（鼠标拖动产生液体流动、跟随黑白主题）+ SVG `feTurbulence/feDisplacementMap` 文字扭曲（鼠标移动增强、静止轻微呼吸）+ 逐字错峰入场
  - Scene 2 **滚动驱动的 3D 环形轮播**：最新 6 篇文章卡片环形环绕（motion useScroll → rotateY），滚动环视
  - Scene 3 **叠层转场文章列表**：sticky 层覆盖前场景 + fade/scale 入场 + 条目错峰
  - **滚动吸附**：局部滚动容器 `snap-y snap-mandatory` + 迷你页脚
  - 组件：`home/fluid-hero.tsx`、`home/scene-carousel.tsx`、`home/post-scene.tsx`、`home/home-scenes.tsx`
  - header 毛玻璃适配局部滚动容器（capture 监听）

### Changed
- 首页数据源：最近 6 篇（3 → 6，轮播 + 列表共用）

## [0.7.5] — 2025-07-11

### Fixed
- **Mermaid 图表/代码块黑色背景不跟随主题**：根因是 v0.7.2 安装的 `@tailwindcss/typography` 默认给 `.prose pre` 深色背景（#1f2937 灰黑）——mermaid 容器和代码块全被染黑，且与黑白主题切换无关（一直黑）。
  修复：globals.css 用 token 覆盖 `.prose pre` 背景（`--color-code`，白模式浅灰 / 黑模式深灰），inline code 同样 token 化。验证：白模式容器 lab(96.5)≈浅灰、黑模式 lab(5.3)≈深灰，绑定黑白切换 ✅

## [0.7.4] — 2025-07-11

### Changed
- **Mermaid 颜色全部回滚**（用户要求）：删除所有自定义 themeVariables（v0.7.1-0.7.3 的 palette/文字强制 CSS），恢复 mermaid neutral 主题**默认配色**（文字 #eeeeee 灰系、节点浅色）。保留功能性修复：不传 CSS 变量/oklch（mermaid 解析器不支持会崩）。
- 删除 globals.css 的 `pre svg text` 强制颜色规则

## [0.7.3] — 2025-07-11

### Fixed
- **Mermaid 内部文字颜色**（用户要求：仅文字纯黑，不动线条/背景）：
  1. 回滚 v0.7.2 误改——线条/边框恢复浅灰（#e3e3e3），仅文字纯黑（#000000）
  2. themeVariables 部分文字变量映射不可靠（时序图 actor 文字不受 `textColor` 控制，补了 `actorTextColor` 等仍失效）
  3. 最终方案：globals.css 用 `!important` CSS 强制 `pre svg text / .nodeLabel / .edgeLabel` 为黑（浅色主题）或浅色（深色主题）——CSS 优先级碾压 mermaid 注入 svg 内部的 `<style>`，且跟随 `.dark` class 自动切换
- 验证：流程图/时序图文字 computed 均为 rgb(0,0,0) ✅，E2E 6/6 ✅

## [0.7.2] — 2025-07-11

### Fixed
- **正文标题字号与正文相同**：根因是 `@tailwindcss/typography` 从未安装——`prose` 类一直未生效（create-next-app 不带此插件），标题/段落/列表全是浏览器默认样式。安装插件（`@plugin` 引入）+ 杂志风标题字号增强：h1 2.2em / h2 1.75em / h3 1.4em / h4 1.15em（正文 1em），标题与正文层级拉开
- **Mermaid 文字颜色**：浅色主题文字改为纯黑 `#000000`（原近黑 #1c1c1c，用户要求纯黑）；深色主题保持浅色

## [0.7.1] — 2025-07-11

### Fixed
- **Mermaid 不渲染**（三个连环坑，全部记录于 `motion-and-interaction.md`）：
  1. `themeVariables` 传 CSS 变量字符串（`var(--color-code)`）→ mermaid 颜色解析器报 "Unsupported color format"（Runtime Error 拖垮客户端渲染树）→ 改为按 `.dark` class 选择 hex 字面量（与 token 视觉等价）
  2. oklch 色值同样不被 mermaid 支持（`Cannot read properties of undefined (reading 'h')`）→ 同上，hex 方案一并解决
  3. `mermaid.render(id, ...)` 的 DOM 插入行为不可靠（svg 未进入目标元素）→ 直接操作 `pre` 引用写入返回值
- **块级公式渲染为空**：`rehype-math-block` 插件只提取 `code` 的直接文本子节点，而 rehype-pretty-code 把文本包在 `<span data-line>` 里 → 公式为空字符串，KaTeX 渲染空公式（之前验证只看 class 存在被误导）→ 递归提取所有文本
- E2E 新增「LaTeX 与 Mermaid 渲染」测试：行内公式/块级公式/SVG 图表全链路浏览器验证（6/6 通过）

## [0.7.0] — 2025-07-11

### Added
- **编辑器增强**（Dashboard 文章表单）
  - 工具条：H2/H3/粗体/斜体/链接/图片/代码/公式（行内 $..$）/公式块（```latex）/Mermaid/引用/表格，光标处插入语法
  - 编辑/预览 Tab：预览用 react-markdown + 与详情页同源插件（LaTeX/代码高亮/Mermaid 均可预览）
- **LaTeX 公式渲染**
  - 行内 `$E=mc^2$`（remark-math + rehype-katex）
  - 块级 ` ```latex ` 代码块（自定义 rehype-math-block 插件 → mathblock 组件，服务端 katex.renderToString）
- **Mermaid 图表**：` ```mermaid ` 代码块 → 客户端动态加载 mermaid 渲染 SVG（黑白主题，`theme: neutral` + token 变量）
- **正文排版优化**：标题（h2 上边框线 + 3em 间距）/段落/代码块/引用/表格间距拉开，字间距保持正常（globals.css prose 定制）
- **评论去审核流**：提交即 approved 直接显示，移除 Dashboard 评论审核页与 approve/spam/delete actions

### Changed
- 依赖：remark-math / rehype-katex / katex / mermaid / react-markdown / unified / unist-util-visit

### Fixed
- **MDX 块级公式三个坑**（均记录于文档）：
  1. `$$` 多行块级在 MDX 管线中被行内化（remark-math 兼容问题）→ 改用 ```latex 代码块 + rehype 插件
  2. `<MathBlock>children</MathBlock>` 的 `{` 被当 JSX 表达式（acorn 解析失败）→ 文本子节点传递
  3. rehype-pretty-code 输出 data-language 属性（非 language-* class）→ 插件按属性检测
- 插件删除 properties 导致后续插件（katex）读 className 崩溃 → 保留空 properties

## [0.6.1] — 2025-07-11

### Fixed
- **Dashboard 删除表单运行时错误**（"Event handlers cannot be passed to Client Component props"）：Server Component 里给 `<form>` 传 `onSubmit`（confirm 确认）违反 Server/Client 边界。拆为 client 组件 `DeletePostForm`（confirm 移入组件内，Server Action 引用跨边界传递）。
  教训：Server Component 中任何表单交互（confirm/受控值/事件）都必须下沉 client 组件——记录于 `server-client-boundary.md` 边界规则。

## [0.6.0] — 2025-07-11

### Added
- **测试基建**：vitest 配置 + 24 个单测（feed/format/toc）+ playwright 配置 + 5 条 E2E 核心流程 + GitHub Actions CI（postgres service）
- **评论防刷**：内存滑动窗口限流（60s/3 次，按 IP），ADR-0005 承诺落地
- **NextAuth v5 鉴权**：GitHub + Credentials（本地 admin）双 provider，`/login` 登录页，`/api/auth/*` 路由
- **Dashboard 创作端**（全部鉴权保护）
  - 概览：文章/评论/待审核统计 + 最近文章
  - 文章管理：列表（状态/评论数）+ 新建/编辑表单（slug 自动生成 + zod 校验 + 草稿/发布）+ 删除（级联评论）
  - 评论审核：pending 优先列表 + 通过/标记垃圾/删除操作
- **SEO 细节**：`/robots.txt`（禁爬 Dashboard/API）+ Article JSON-LD 结构化数据
- `AUTH_TRUST_HOST` 环境变量（本地非 localhost 端口信任）

### Changed
- 数据访问层扩展：`getPostsPage`（分页）、`getAdjacentPosts`、`getRelatedPosts`

### Fixed
- **Next.js 16 breaking change：`revalidateTag` 必须双参数**（`tag, "max"`，单参已废弃且类型报错）。全部调用点 + 5 处文档示例融合更新
- E2E 断言歧义（页面 h1 与 MDX 正文 h1 重名）

## [0.5.1] — 2025-07-11

### Fixed
- **黑白切换按钮"无效"（系统暗色时）**：切换只移除 `.dark` 未加 `.light`，系统偏好暗色时 CSS 媒体查询（`:root:not(.light)`）立即把变量变回黑，页面纹丝不动。
  修复：三态 class 管理——`dark`（黑）/ `light`（显式白，阻止媒体查询）/ 无 class（跟随系统）；防 FOUC 脚本同步处理 `light` 存储值。

## [0.5.0] — 2025-07-11

### Added
- **MDX 阅读体验增强**
  - 代码高亮：shiki 自定义主题（黑白灰层次，CSS 变量跟随 .dark；shiki 4 已移除内置 css-variables 主题，自建 `src/lib/code-theme.ts`）
  - Callout 提示框 + 图片点击放大（client，黑白 overlay，Esc/点击关闭）
  - 文章目录 TOC（rehype-slug 锚点 + 桌面端 sticky 侧栏）
  - 上一篇/下一篇导航 + 相关文章（同标签 `&&` 数组交集）
- **列表分页**：`/blog?page=N`（每页 10 篇，页码导航，与标签筛选可组合）
- **归档页** `/archive`：按 年→月 分组
- **关于页** `/about`：品牌故事 + 博客定位
- **全局错误页**：`not-found.tsx` / `error.tsx`（client，重新加载按钮）
- 导航增加"归档/关于"入口
- seed 扩充：12 篇填充文章（分页测试）+ Callout/代码块示例

### Fixed
- **全局 loading.tsx 导致 404 状态码回归**（v0.4.1 修复后复发）：app/loading.tsx 同样包裹 [slug] 路由，流式 shell 先发 200。删除全局 loading.tsx，规则更新于 streaming-and-suspense.md
- **unstable_cache Date 序列化崩溃**：缓存命中后 publishedAt 变 string，归档页 `getFullYear` 报错。消费方统一 `new Date()`，坑记录于 caching-and-revalidation.md
- **shiki 4 移除 css-variables 主题**：改用自定义主题对象（CSS 变量色值）

### Deprecated
- 全局 loading.tsx 方案（与真实 404 状态码互斥，本项目弃用）

## [0.4.1] — 2025-07-11

### Fixed
- **Hydration mismatch（黑白模式防 FOUC 脚本引发）**：脚本在水合前给 `<html>` 添加/移除 `dark` class，React 水合对比服务器 className 时发现差异报错。
  修复：`<html suppressHydrationWarning>`（React 官方针对"外部脚本修改属性"的逃逸阀）+ 脚本移入 `<head>`（更早执行，白闪更小）。
  踩坑记录已写入 `styling-conventions.md` 黑白模式节。

## [0.4.0] — 2025-07-11

### Added
- **黑白双模式**（class 策略）
  - `@custom-variant dark` + `.dark` token 覆盖 + 系统偏好兜底（`:root:not(.light)`）
  - Header 主题切换按钮（lucide-react Moon/Sun）+ localStorage 持久化
  - 防 FOUC 脚本（layout.tsx 首帧前应用 class）
  - 规范写入 `styling-conventions.md`「黑白双模式」节：组件必须用 token 色，禁止硬编码（含反例），新增组件自动适配双模式
- **大气布局**：页面容器 `max-w-2xl`(42rem) → `max-w-4xl`(56rem)
  - Hero `text-7xl md:text-8xl`、`py-24 md:py-32`
  - 列表条目 `py-8`、标题 `text-3xl`
  - 详情正文/评论区 `max-w-3xl` 限宽居中（阅读体验），框架放宽
  - 布局宽度规范更新 `design/layout-patterns.md`

### Changed
- `globals.css`：暗色模式从纯 media 查询改为 class 策略（保留系统兜底）
- `site-header.tsx`：加入主题切换按钮，容器加宽
- `visual-style-guide.md` / `responsive-and-a11y.md`：双模式对比度要求
- `roadmap.md`：黑白模式标记完成

## [0.3.0] — 2025-07-11

### Added
- **动效系统**（`design/motion-and-interaction.md` 定稿）
  - Hero 花体逐字拆字浮现（Apple Hello Effect 思路，纯 CSS 零 JS）
  - 进入视口淡入上移（motion `FadeIn` 组件，easeOutQuint、once）
  - Header 滚动毛玻璃（sticky + backdrop-blur-md）
  - 卡片 hover 位移、评论表单提交状态 AnimatePresence 切换
  - 依赖：`motion` 12（framer-motion）
- **标签筛选**：`/blog?tag=xxx` + 筛选栏（高亮当前标签，`ANY(posts.tags)` 查询）
- **RSS Feed**：`/feed.xml`（`src/lib/feed.ts` 纯函数生成 + Route Handler）
- **Sitemap**：`/sitemap.xml`（Next.js 内置 `app/sitemap.ts` 约定）
- `SITE_URL` 环境变量（RSS/Sitemap 绝对链接前缀）

### Changed
- 根 layout header → `SiteHeader`（client，滚动毛玻璃）
- `api/route-handlers.md`：Sitemap 改用内置约定，非手写 route.ts

## [0.2.1] — 2025-07-11

### Added
- **博客功能实现**（数据库全链路打通）
  - `/blog` 文章列表页（`(marketing)/blog/page.tsx`，SSR + unstable_cache）
  - `/blog/[slug]` 详情页（generateMetadata + next-mdx-remote 渲染 + 评论）
  - 评论系统：Server Action（zod 校验 + pending 审核流）+ `useActionState` 表单
  - `src/lib/comments.ts` 评论数据访问层（不缓存）
  - 根 layout 杂志风导航（花体 Logo + 极简链接）
- **数据库落地**：Docker postgres:16 容器（robinelysia-postgres）+ 迁移 `0000_amused_robin_chapel.sql` + seed 脚本（`pnpm seed`）
- `dotenv`/`tsx` devDependency（seed 与 drizzle-kit 的 .env.local 加载）

### Fixed
- **loading.tsx 破坏 404 状态码**：流式渲染先发 200 shell，async `notFound()` 无法改状态码；移除 `/blog/[slug]/loading.tsx`，规则写入 `streaming-and-suspense.md`
- **unstable_cache 缓存键 bug**：带参查询的 keyParts 未含参数导致共享缓存；改为函数内调用 `unstable_cache`，slug 纳入缓存键

## [0.2.0] — 2025-07-11

### Added
- **品牌定稿**：RobinElysia（Robin And Elysia）· 黑白简约杂志风格
  - 字体体系：Italianno（花体 Hero）+ Inter（标题）+ SF 系统栈（正文）
  - Design Token：黑白灰四色 oklch 体系，全站禁止彩色强调
- **数据库架构**：PostgreSQL + Drizzle ORM（ADR-0005）
  - `posts` 表（Markdown 原文存储、TEXT[] tags、draft/published 状态）
  - `comments` 表（自建评论，pending/approved/spam 审核流，FK 级联删除）
  - `src/lib/`：db.ts（连接池单例）、schema.ts、posts.ts（unstable_cache 数据访问层）、format.ts
  - `drizzle.config.ts` + pnpm-workspace.yaml（构建脚本白名单）
- **包管理器迁移**：npm → pnpm 11（全部依赖一次性补齐：drizzle-orm/pg/zod/next-mdx-remote/lucide-react + vitest/playwright/testing-library/drizzle-kit）
- **首页实现**：花体 Hero + 最近文章列表（SSR force-dynamic，避免 build 时连库）
- **工程修正**：next.config.ts（images.formats）、.env.example、typecheck 脚本
- **审查报告登记规则**：审查报告归档 releases/ + INDEX 登记 review-snapshot

### Changed
- 渲染策略：数据源确定后统一 SSR + unstable_cache（ISR 留待流量上来后启用）
- 缓存策略：fetch Data Cache → unstable_cache（数据库直连不经过 fetch 缓存）
- 评论架构：Giscus → 自建 PostGre（ADR-0005）
- 路由结构：C 端无鉴权 / Dashboard NextAuth 保护（用户决策确认）
- `component-conventions.md`：修正路由文件导出规则（Next.js 要求 default export）
- `runtime-and-deployment.md`：`serverActions` 配置在 Next.js 16 已移入 experimental（以类型定义为准）

### Fixed
- 9 个文档 frontmatter status（draft → stable）与 INDEX 统计不一致
- `component-conventions.md` 错误的"页面文件用 named export"规则
- `.gitignore` 忽略 `.env.example`（加 `!.env.example`）

## [0.1.0] — 2025-07-11

### Added
- 项目初始化：Next.js 16 + TypeScript strict + Tailwind CSS 4 + App Router
- `.claude/` 文档架构搭建
  - `architecture/`：系统架构、路由地图、渲染策略、Server/Client 边界、数据流、运行时
  - `conventions/`：组件、路由、数据获取、样式、代码质量、Commit/PR、ESLint、TypeScript
  - `data-layer/`：Server Actions 契约、缓存策略、客户端状态、Streaming/Suspense
  - `design/`：视觉风格指南、布局模式、Loading/Error 状态、响应式/无障碍
  - `api/`：OpenAPI 契约、版本管理
  - `testing/`：测试策略、组件测试、E2E 测试、评估场景
  - `loop-engine/`：Agent Loop 协议、自动代码审查、自动代码清理
  - `future/`、`releases/`、`task/`、`problem/`、`onboarding/`
- ADR 0001-0004（全部已填充）

### Changed
- 无（初始版本）

### Fixed
- 无（初始版本）

### Deprecated
- 无（初始版本）

---

## 变更记录格式

后续每次发布按以下格式追加：

```
## [版本号] — YYYY-MM-DD

### Added
- 新功能 1
- 新功能 2

### Changed
- 变更 1

### Fixed
- 修复 1

### Deprecated
- 即将移除的功能
```

遵循 [Keep a Changelog](https://keepachangelog.com/) 约定。版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。
