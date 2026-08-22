import { describe, expect, it, vi } from "vitest";
import {
  buildWellcomeImageURL,
  isUsableLicense,
  pickQuery,
  toUsableHit,
  QUERY_POOL,
} from "@/lib/archive-source";

/**
 * 档案图候选源纯函数测试（v0.22.0）
 * 不触网：只测 URL 构造 / license 白名单 / 主题池抽取 / 命中过滤
 */

describe("buildWellcomeImageURL", () => {
  it("接受裸 iiif id", () => {
    expect(buildWellcomeImageURL("L0040199")).toBe(
      "https://iiif.wellcomecollection.org/image/L0040199/full/1200,/0/default.jpg",
    );
  });

  it("接受完整 iiif URL 并提取 id", () => {
    expect(
      buildWellcomeImageURL("https://iiif.wellcomecollection.org/image/V0007533/info.json"),
    ).toBe("https://iiif.wellcomecollection.org/image/V0007533/full/1200,/0/default.jpg");
  });

  it("支持自定义尺寸", () => {
    expect(buildWellcomeImageURL("L0040199", "400,")).toContain("/full/400,/0/default.jpg");
  });
});

describe("isUsableLicense", () => {
  it("PDM / CC0 / CC BY 可用", () => {
    expect(isUsableLicense("Public Domain Mark")).toBe(true);
    expect(isUsableLicense("CC0 1.0 Universal")).toBe(true);
    expect(isUsableLicense("Attribution 4.0 International (CC BY 4.0)")).toBe(true);
  });

  it("版权未明 / 禁止类排除", () => {
    expect(isUsableLicense("In copyright")).toBe(false);
    expect(isUsableLicense("All rights reserved")).toBe(false);
    expect(isUsableLicense("Copyright not evaluated")).toBe(false);
  });

  it("缺失 license 排除", () => {
    expect(isUsableLicense(null)).toBe(false);
    expect(isUsableLicense("")).toBe(false);
  });
});

describe("pickQuery", () => {
  it("从主题池抽取", () => {
    expect(QUERY_POOL).toContain(pickQuery(() => 0));
    expect(pickQuery(() => 0.9999)).toBe(QUERY_POOL[QUERY_POOL.length - 1]);
  });
});

describe("toUsableHit", () => {
  const excluded = new Set<string>(["used-work-1"]);

  const rawHit = (over: Record<string, unknown> = {}) => ({
    id: "img-1",
    source: {
      id: "work-1",
      title: "Astronomy plate",
      contributors: [{ agent: { label: "Lucas Kilian" } }],
    },
    thumbnail: { url: "https://iiif.wellcomecollection.org/image/L0040199/info.json" },
    locations: [{ license: { label: "Public Domain Mark" } }],
    ...over,
  });

  it("合规命中 → 提取完整信息", () => {
    expect(toUsableHit(rawHit(), excluded)).toEqual({
      id: "img-1",
      workId: "work-1",
      title: "Astronomy plate",
      iiifId: "L0040199",
      creator: "Lucas Kilian",
      license: "Public Domain Mark",
    });
  });

  it("已用 work 排除", () => {
    expect(toUsableHit(rawHit({ source: { id: "used-work-1" } }), excluded)).toBeNull();
  });

  it("license 不合规排除", () => {
    const hit = rawHit();
    hit.locations = [{ license: { label: "In copyright" } }];
    expect(toUsableHit(hit, excluded)).toBeNull();
  });

  it("缺 IIIF 缩略图排除", () => {
    expect(toUsableHit(rawHit({ thumbnail: null }), excluded)).toBeNull();
  });

  it("缺 source.id 排除", () => {
    expect(toUsableHit(rawHit({ source: {} }), excluded)).toBeNull();
  });
});

describe("fetchArchiveCandidates 集成守卫", () => {
  it("模块可被 import（db 懒连接不触发网络）", async () => {
    const mod = await import("@/lib/archive-source");
    expect(typeof mod.fetchArchiveCandidates).toBe("function");
  });

  it("vi 在作用域内（防 globals 配置回归）", () => {
    expect(vi.isMockFunction(vi.fn())).toBe(true);
  });
});
