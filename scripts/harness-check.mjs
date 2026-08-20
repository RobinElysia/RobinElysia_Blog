/**
 * Harness 防漂移门禁（圆桌决议 A2，2026-08-20）
 * 零依赖 Node 脚本，把"文档与代码同步"从个人纪律固化为 CI 门禁。
 * 运行：node scripts/harness-check.mjs
 * 退出码：0 = 通过；1 = 有阻断项（CI 将失败）
 *
 * 检查项：
 *  1. 禁用词残留：.harness / pending 审核流 / npm run（排除历史快照与生成物）
 *  2. INDEX 双向孤儿：.claude 下 md 文件 vs INDEX.md 登记（INDEX 自身除外）
 *  3. .env.example 键集 vs runtime-and-deployment.md 环境变量表
 *  4. src/app 路由文件 vs app-router-map.md 路由树（关键字抽查：存在的路由文件不应被标注"不存在"）
 *  5. 契约文档陈旧告警：关键契约文档 last-updated 超过 90 天且 sources 指向的源码有更新（提示性，不阻断）
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const EXCLUDE_DIRS = new Set([
  ".git",
  ".next",
  "node_modules",
  ".dsm",
  "_md_output",
  "test-results",
  "public",
]);
let failures = [];
let warnings = [];

/** 遍历文本文件 */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (EXCLUDE_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (name !== "pnpm-lock.yaml" && !name.endsWith(".tsbuildinfo")) out.push(full);
  }
  return out;
}

const files = walk(ROOT);

// ---------- 检查 1：禁用词残留 ----------
const isRelease = (p) => p.split(/[\\/]/).includes("releases");
const isSelf = (p) => p.endsWith("harness-check.mjs");
const FORBIDDEN = [
  { re: /\.harness/, label: ".harness 路径残留", exclude: (p) => isRelease(p) || isSelf(p) },
  {
    re: /pending 审核流|审核后可见|审核链路/,
    label: "评论审核流残留",
    exclude: (p) => isRelease(p) || isSelf(p),
  },
  {
    re: /npm run |npx tsc/,
    label: "npm 命令残留",
    exclude: (p) => isRelease(p) || isSelf(p) || p.includes("roundtable"),
  },
];
for (const f of files) {
  const buf = readFileSync(f);
  if (buf.includes(0)) continue;
  const text = buf.toString("utf8");
  for (const rule of FORBIDDEN) {
    if (rule.re.test(text) && !rule.exclude(f)) {
      failures.push(`${rule.label} → ${relative(ROOT, f)}`);
    }
  }
}

// ---------- 检查 2：INDEX 双向孤儿 ----------
const indexPath = join(ROOT, ".claude", "INDEX.md");
if (existsSync(indexPath)) {
  const idx = readFileSync(indexPath, "utf8");
  const mdFiles = walk(join(ROOT, ".claude"))
    .filter((f) => f.endsWith(".md"))
    .map((f) => relative(join(ROOT, ".claude"), f).replace(/\\/g, "/"))
    .filter((f) => f !== "INDEX.md");
  // 方向 1：实际文件 → INDEX 必须登记其相对路径（INDEX 表格以 `architecture/xxx.md` 形式登记）
  for (const f of mdFiles) {
    if (!idx.includes(f)) {
      failures.push(`INDEX 未登记（缺相对路径条目）→ ${f}`);
    }
  }
  // 方向 2：INDEX 登记的相对路径 → 实际文件必须存在（按登记路径解析，捕获错目录/幽灵登记）
  const listed = new Set([...idx.matchAll(/`([^`]+\.md)`/g)].map((m) => m[1].replace(/\\/g, "/")));
  for (const ref of listed) {
    if (ref === "INDEX.md" || ref.endsWith("DESIGN.md") || /^NNNN-/.test(ref.split("/").pop()))
      continue;
    const p = join(ROOT, ".claude", ref);
    if (!existsSync(p)) failures.push(`INDEX 登记但文件不存在（按登记路径解析）→ ${ref}`);
  }
}

// ---------- 检查 3：环境变量键集双向对齐 ----------
const envPath = join(ROOT, ".env.example");
const runtimePath = join(ROOT, ".claude", "architecture", "runtime-and-deployment.md");
if (existsSync(envPath) && existsSync(runtimePath)) {
  const envLines = readFileSync(envPath, "utf8").split("\n");
  // 同时解析已启用（A=）与注释占位（# A=）的变量名
  const envKeys = new Set(
    envLines
      .map((l) => l.trim())
      .filter((l) => /^(#\s*)?[A-Z][A-Z0-9_]*=/.test(l))
      .map((l) => l.replace(/^#\s*/, "").split("=")[0]),
  );
  const doc = readFileSync(runtimePath, "utf8");
  const docKeys = new Set([...doc.matchAll(/`([A-Z][A-Z0-9_]*)`/g)].map((m) => m[1]));
  const relevant = (k) => !k.startsWith("PROD_"); // PROD_* 是 Docker 部署插值层，不要求入表
  const missingInDoc = [...envKeys].filter((k) => relevant(k) && !docKeys.has(k));
  const extraInDoc = [...docKeys].filter((k) => relevant(k) && !envKeys.has(k));
  if (missingInDoc.length > 0) failures.push(`环境变量表缺键 → ${missingInDoc.join(", ")}`);
  if (extraInDoc.length > 0)
    failures.push(`环境变量表多余键（.env.example 无）→ ${extraInDoc.join(", ")}`);
}

// ---------- 检查 4：路由文件 vs 路由地图「不存在」清单 ----------
// 实现说明（对齐注释与实现）：不做整树解析（路由树是 markdown 代码块，解析脆弱）；
// 门禁职责 = 捕获「文档声称不存在的路由实际存在」这类漂移，以及「关键路由文件完全未入图」。
const routerMap = join(ROOT, ".claude", "architecture", "app-router-map.md");
if (existsSync(routerMap)) {
  const mapText = readFileSync(routerMap, "utf8");
  const appDir = join(ROOT, "src", "app");
  const routeFiles = walk(appDir).filter((f) =>
    /(page|layout|route|not-found|error|robots|sitemap)\.(ts|tsx)$/.test(f),
  );
  // 1. 文档「不存在」清单（app-router-map.md 的"不存在的路由/文件"节）中的名字实际存在 → 阻断
  const missingSection = mapText.split(/\n## /).find((s) => s.includes("不存在的路由"));
  if (missingSection) {
    const claimed = new Set(
      [...missingSection.matchAll(/`([^`]+)`/g)].map((m) =>
        m[1]
          .split("/")
          .pop()
          .replace(/\.(ts|tsx|md)$/, ""),
      ),
    );
    for (const f of routeFiles) {
      const base = f
        .split(/[\\/]/)
        .pop()
        .replace(/\.(ts|tsx)$/, "")
        .replace(/[[\]]/g, "");
      if (claimed.has(base))
        failures.push(`路由存在但文档标注不存在 → ${relative(appDir, f).replace(/\\/g, "/")}`);
    }
  }
  // 2. 关键路由文件名（page/layout/route 的 basename 集合）必须在地图中出现（防整节被删）
  const routeBases = new Set(
    routeFiles.map((f) =>
      f
        .split(/[\\/]/)
        .pop()
        .replace(/\.(ts|tsx)$/, "")
        .replace(/[[\]]/g, ""),
    ),
  );
  const missingInMap = [...routeBases].filter((b) => !mapText.includes(b));
  if (missingInMap.length > 0) failures.push(`路由地图未提及 → ${missingInMap.join(", ")}`);
}

// ---------- 检查 5：契约文档陈旧告警（提示性，不阻断） ----------
// 实现说明：契约层文档 last-updated 超过 90 天即告警（提示人工复核）；不做 sources 时间戳比对。
const CONTRACT_DOCS = [
  "architecture/app-router-map.md",
  "architecture/runtime-and-deployment.md",
  "data-layer/caching-and-revalidation.md",
  "data-layer/server-actions-contract.md",
];
const now = Date.now();
for (const doc of CONTRACT_DOCS) {
  const p = join(ROOT, ".claude", doc);
  if (!existsSync(p)) continue;
  const m = readFileSync(p, "utf8").match(/^last-updated:\s*(\d{4}-\d{2}-\d{2})/m);
  if (m) {
    const age = (now - new Date(m[1]).getTime()) / 86400000;
    if (age > 90) warnings.push(`${doc} last-updated 超过 90 天（${m[1]}），建议复核`);
  }
}

// ---------- 输出 ----------
// eslint-disable-next-line no-console -- CLI 门禁脚本，输出是其职责（同 seed.ts/migrate.mjs）
console.log(`harness-check: ${files.length} files scanned`);
// eslint-disable-next-line no-console -- 同上：警告列表输出
for (const w of warnings) console.log(`  [warn] ${w}`);
if (failures.length > 0) {
  for (const f of failures) console.error(`  [FAIL] ${f}`);
  console.error(`harness-check: ${failures.length} 阻断项`);
  process.exit(1);
}
// eslint-disable-next-line no-console -- 同上：通过提示
console.log("harness-check: 通过 ✅（契约层与代码一致）");
