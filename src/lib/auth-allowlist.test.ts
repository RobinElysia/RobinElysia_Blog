import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isGithubUserAllowed } from "@/lib/auth-allowlist";

describe("GitHub 登录白名单", () => {
  const original = process.env.AUTH_GITHUB_ALLOWED_USERS;

  afterEach(() => {
    process.env.AUTH_GITHUB_ALLOWED_USERS = original;
  });

  it("列表为空时拒绝所有 GitHub 登录（安全默认）", () => {
    delete process.env.AUTH_GITHUB_ALLOWED_USERS;
    expect(isGithubUserAllowed("meowin", "meowin@example.com")).toBe(false);
  });

  it("用户名命中白名单允许登录", () => {
    process.env.AUTH_GITHUB_ALLOWED_USERS = "meowin, kiki";
    expect(isGithubUserAllowed("meowin", null)).toBe(true);
  });

  it("用户名大小写不敏感", () => {
    process.env.AUTH_GITHUB_ALLOWED_USERS = "Meowin";
    expect(isGithubUserAllowed("MEOWIN", null)).toBe(true);
  });

  it("邮箱命中白名单允许登录", () => {
    process.env.AUTH_GITHUB_ALLOWED_USERS = "meowin@example.com";
    expect(isGithubUserAllowed("someone", "Meowin@Example.com")).toBe(true);
  });

  it("白名单外的用户拒绝登录", () => {
    process.env.AUTH_GITHUB_ALLOWED_USERS = "meowin";
    expect(isGithubUserAllowed("hacker", "hacker@evil.com")).toBe(false);
  });

  it("容忍多余空格与空项", () => {
    process.env.AUTH_GITHUB_ALLOWED_USERS = " meowin , , kiki ";
    expect(isGithubUserAllowed("kiki", null)).toBe(true);
    expect(isGithubUserAllowed("other", null)).toBe(false);
  });
});
