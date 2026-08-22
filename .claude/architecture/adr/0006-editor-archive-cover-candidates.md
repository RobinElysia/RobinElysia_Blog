---
status: stable
owner: architecture
last-updated: 2026-08-22
related-adr: [0005]
---

# ADR 0006: 编辑器档案图候选管线（Wellcome 直连 + PostGre BYTEA）

## 状态

已接受（2026-08-22）

## 背景

DESIGN.md §4 确立了"档案图作为一等公民"：文章封面来自公共领域藏品而非 AI/库存图。原流程依赖 agent 通过 `archival-imagery-mcp`（stdio MCP server）人工取图落盘 `public/archive/`，每张图要手工记录元数据、改代码绑定。这有两个问题：

1. **每篇文章都要一次 agent 取图操作**，创作流程被工具链卡住；
2. **Vercel 部署下运行时文件系统只读**，无法在编辑器里直接写 `public/`。

用户要求：编辑器内一键"获取 3 张新档案图"（存本地、不与站内已用图重复），从中选 1 张绑定为封面。

## 决策

### 1. 直连 Wellcome Collection API，不内嵌 MCP server

`archival-imagery-mcp` 的 Wellcome 工具本质是对 `api.wellcomecollection.org` REST API 的薄封装（免 API key）。MCP 是面向 agent 客户端的 stdio 进程协议，嵌入 Next.js 请求链路既无必要也引入进程管理复杂度。本项目在 `src/lib/archive-source.ts` 复用同等调用逻辑（检索、IIIF 图 URL 构造、license 过滤），**零新增运行时依赖**（原生 `fetch`）。

**代价**：丢失 MCP 的多馆聚合（Met/LoC/Smithsonian/Europeana）。本项目全部既有档案图均来自 Wellcome，单一来源满足当前气质与版权需求；未来需要多馆时再扩展 `archive-source.ts`（该模块已按来源隔离设计）。

### 2. 候选图存 PostGre `images` 表（BYTEA），不走文件系统

沿用 v0.18.0 已确立的 PostGre BYTEA 方案（与编辑器粘贴上传同一管道）：

- Vercel 运行时只读文件系统 → 写 `public/` 不可行；BYTEA 在 Vercel/Docker 下通用；
- `/api/images/[id]` 已提供 immutable 永久缓存服务；
- 图片走 `unstable_cache` 之外的 DB 直接访问，与既有图片管线一致。

`images` 表新增（迁移 `0002_overconfident_gamma_corps`）：

| 列 | 用途 |
|----|------|
| `kind` | `inline`（正文上传，历史数据默认）/ `cover`（档案图封面候选） |
| `source_id` | Wellcome work id——**去重键**：站内已取过的 work 不再推荐 |
| `title`/`creator`/`date`/`source`/`source_url`/`license` | 档案元数据（kind='cover' 时有值） |

`posts` 表新增 `cover_credit`：编辑器绑定的档案图署名行。**由服务端在保存时从 images 元数据生成**（`formatCredit` 复用），不信任客户端提交的署名文本。

### 3. 编辑器交互：获取 3 张 → 选 1 绑定

- `POST /api/archive-candidates`（admin 鉴权 + 60s/5 次限流）：可选关键词，缺省时从主题池（天文/植物/解剖/炼金/印刷/地图/手稿等 12 词）随机抽取；检索 → license 白名单过滤（PDM/CC0/CC-BY）→ 排除已用 work id → 下载 3 张（IIIF width 1200，≤5MB）入库 → 返回本地 URL + 元数据。
- 编辑器（`archive-candidate-picker.tsx`）展示 3 张候选，点击绑定填入 `coverImage` 表单字段；保存时服务端解析 `/api/images/{id}` → 生成 `cover_credit`。
- 展示层：`PostCard`/`CardInfo` 优先 `cover_credit`，回退既有静态映射逻辑（老文章不受影响）。

### 4. 孤儿清扫

未选中的候选图成为孤儿。清扫规则：**kind='cover' 且 >24h 未被任何文章引用**（`cover_image` 精确匹配或正文包含该 URL）即删除。清扫时机：每次获取新候选前执行。24h 窗口防止"选中了但还没保存文章"时被误删。

## 后果

**正面**：编辑流程闭环——创作时即得合规档案图，无手工落盘与元数据登记；署名元数据自动随文章持久化。

**负面**：

- 每次"获取 3 张"外呼 Wellcome API + 下载约 1.5MB 图（3×500KB），依赖上游可用性（失败返回 502 提示重试）；
- 主题池随机的候选图与文章主题可能无语义关联——编辑器保留关键词输入作为补充（DESIGN.md §4 选图准则第 3 条仍由作者最终把关）；
- 未选中的候选在 24h 内占用少量存储（每张 ~500KB）。
