/**
 * 友链数据（v0.22.x，静态数据不动 DB）
 * - avatar 字段保留（数据完整）：当前 UI 已按用户要求不渲染头像
 * - 无链接（link 空/'/'）→ 不渲染链接，仅卡片
 * - tag 彩色例外：站长指定 purple/green/orange 三色（见 DESIGN.md §2 例外条款）
 */
export type FriendTagColor = "purple" | "green" | "orange";

export type FriendTag = {
  text: string;
  color?: FriendTagColor;
};

export type Friend = {
  name: string;
  avatar: string | null;
  description: string;
  link: string | null;
  tags: FriendTag[];
};

/** 原始数据里 '/' 或空串表示"暂无"，统一归一化为 null */
const normalize = (v: string | undefined): string | null => (!v || v === "/" ? null : v);

type RawFriend = {
  name: string;
  avatar?: string;
  description: string;
  link?: string;
  tags?: FriendTag[];
};

const RAW: RawFriend[] = [
  {
    name: "ReZenKi",
    avatar: "/",
    description: "全栈开发ing | 热爱技术与创新",
    link: "https://meowin.asia",
    tags: [{ text: "CS补天计划ing" }, { text: "站长", color: "purple" }],
  },
  {
    name: "ICStudio",
    avatar: "/",
    description: "枫城 | React全栈",
    link: "http://icstudio.top/",
    tags: [{ text: "一站式开发" }, { text: 'Rust"带盐人"', color: "green" }],
  },
  {
    name: "叁玖",
    avatar: "/",
    description: "密码学/加密研究者 | 网络安全",
    link: "https://www.sanjiuctf.com",
    tags: [
      { text: "密码学", color: "orange" },
      { text: "__，__！", color: "purple" },
    ],
  },
  {
    name: "魔理沙",
    avatar:
      "https://pica.zhimg.com/466406875631534fc5629e5c75a58a7a_xll.jpg?source=32738c0c&needBackground=1",
    description: "雾雨魔法店 CEO | 魔理沙",
    link: "https://marisa.moe/",
    tags: [
      { text: "phd 在读", color: "orange" },
      { text: "知乎大佬", color: "green" },
    ],
  },
  {
    name: "Purpleplanen",
    avatar: "/",
    description: "前端开发 | Fumo",
    link: "/",
    tags: [{ text: "前端", color: "purple" }, { text: "UI/UX" }],
  },
  {
    name: "蕾米 Remi Guan",
    avatar: "/",
    description: "全栈 | 蕾米",
    link: "/",
    tags: [
      { text: "技术沉思录", color: "orange" },
      { text: "舞萌", color: "purple" },
    ],
  },
  {
    name: "rand777",
    avatar:
      "https://avatars.githubusercontent.com/u/91131723?s=400&u=cc52bb8ae67e4a4706570ac84399dc7519cfa749&v=4",
    description: "摇摇晃晃，也能到达目的地。",
    link: "https://www.rand777.com/",
    tags: [
      { text: "笨笨的", color: "green" },
      { text: "ENTJ-A", color: "purple" },
    ],
  },
  {
    name: "LunaRain_079",
    avatar: "https://avatars.githubusercontent.com/u/176664901?v=4",
    description: "独酌清月",
    link: "https://www.lunarain.top/",
    tags: [
      { text: "CS learner", color: "orange" },
      { text: "ENTJ-A", color: "purple" },
    ],
  },
  {
    name: "Immortal's Blog",
    avatar: "https://q1.qlogo.cn/g?b=qq&nk=188191770&s=640",
    description: "Immortal's Blog",
    link: "https://blog.immortel.top/",
    tags: [{ text: "随便吧", color: "purple" }],
  },
];

export const FRIENDS: Friend[] = RAW.map((f) => ({
  name: f.name,
  avatar: normalize(f.avatar),
  description: f.description,
  link: normalize(f.link),
  tags: f.tags ?? [],
}));
