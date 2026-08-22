---
status: review-snapshot
owner: review
last-updated: 2026-08-22
review-scope: 编辑器档案图候选功能（Wellcome 直连管线 / BYTEA 入库 / 编辑器绑定 / 展示层署名 / 门禁与文档同步）
---

# 审查报告 0012 — 编辑器档案图候选

## 执行摘要

按用户需求实现"编辑页一键获取 3 张新档案图 → 选 1 绑定为封面"：服务端直连 Wellcome Collection API（复用 archival-imagery-mcp 的 Wellcome 逻辑，不内嵌 MCP stdio server，零新增运行时依赖），下载 3 张存 PostGre（BYTEA），编辑器点选绑定，署名行由服务端生成。走完整五阶段循环，全部验证通过。

## 一、功能清单

| 模块 | 内容 |
|------|------|
| `src/lib/archive-source.ts` | Wellcome 检索（images 端点 + contributors include）、IIIF URL 构造、license 白名单（PDM/CC0/CC-BY）、站内已用 work id 去重、主题池（12 词）随机、下载入库（≤5MB/张，8s 超时） |
| `src/app/api/archive-candidates/route.ts` | POST 端点：admin 鉴权 + 60s/5 次限流 + zod 校验 + 上游失败 502 |
| `src/components/admin/archive-candidate-picker.tsx` | 编辑器 UI：关键词输入（留空随机）、获取/换一批、3 张候选缩略图 + 元数据、点击绑定填入 #coverImage、选中高亮 |
| `src/lib/images.ts` | `insertCoverImage`（kind='cover' + 元数据）、`sweepOrphanCoverImages`（>24h 未被引用即删）、`parseImageIdFromSrc` |
| `src/actions/admin.ts` | `resolveCoverCredit`：`/api/images/{id}` → 查 images 元数据 → 服务端生成 `cover_credit`（不信任客户端）；引用不存在图片 → 返回错误 |
| 展示层 | `posts.ts` select coverCredit；`PostCard`/`CardInfo` 优先 coverCredit、回退静态映射（老文章零影响） |
| Schema | 迁移 `0002`：images + kind/source_id/title/creator/date/source/source_url/license；posts + cover_credit |

## 二、关键决策（ADR-0006 摘要）

1. **直连 Wellcome API 而非内嵌 MCP**：MCP 是 agent 客户端的 stdio 进程协议；其 Wellcome 工具就是 REST 薄封装（免 key），直接复用同等逻辑，零新增运行时依赖。
2. **BYTEA 而非文件系统**：Vercel 运行时只读文件系统；沿用 v0.18.0 图片管道，`/api/images/[id]` immutable 缓存服务现成。
3. **去重**：`images.source_id` + 静态映射 work id 构成"已用集合"，同一藏品不再重复推荐。
4. **孤儿清扫**：kind='cover' 且 >24h 未被引用（cover_image 精确匹配或正文包含 URL）即删；24h 窗口防误删"选中未保存"场景。

## 三、验证

| 检查项 | 结果 |
|--------|------|
| `pnpm build` | ✅（Next 16.2.11，17 路由） |
| `pnpm typecheck` | ✅ |
| `pnpm lint` | 0 error ✅（110 warn：explicit-function-return-type 等渐进收敛项） |
| `pnpm test` | 44/44 ✅（新增 archive-source 14 个纯函数单测） |
| `node scripts/harness-check.mjs` | ✅（169 文件） |
| 真实 Wellcome API 集成冒烟（临时脚本，验证后已删） | ✅：检索 astronomy 得 3 张（PDM×2 + CC BY×1），下载入库（IIIF width 1200 ≈ 400-500KB/张），元数据（creator/license/title）正确，测试行已清理 |
| 路由运行时冒烟（dev server） | ✅：未登录 POST → 401 |
| 迁移应用 | ✅：`0002` 在本地容器库 + 一次性测试库（5433）两次应用成功 |

> 说明：本地 Docker 容器库密码与 `.env.local` 不一致、且容器未对外发布 5432，属环境配置问题（生产迁移由容器启动脚本 `migrate.mjs` 执行，不经过宿主机）；集成验证改用一次性测试容器完成，无项目文件改动。

## 四、已登记的技术债务 / 已知遗留

1. **候选图与文章主题的语义关联**：主题池随机可能出图与文无关；编辑器保留关键词输入作为补充，选图准则第 3 条由作者最终把关（DESIGN.md §4 已注明）。
2. **Wellcome 单一来源**：Met/LoC/Smithsonian/Europeana 未接入（MCP 的多馆聚合能力未移植）；`archive-source.ts` 按来源隔离设计，未来扩展时新增 source 模块即可。
3. **images 端点不提供年代**：`date` 字段留空（需 works 端点二次查询，成本/收益不划算）；署名行对空值有 `filter(Boolean)` 兜底。
4. **编辑器 e2e 未覆盖**：档案图候选依赖外部上游，CI 自动化会抖动；按 test-strategy.md「什么可以不测」归入人工冒烟范围。
5. **孤儿清扫 24h 窗口**：未选中候选在窗口期内占 ~500KB×N 存储，可接受。
