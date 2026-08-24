import type { Metadata } from "next";
import { MusicPageClient } from "@/components/music/music-page-client";

export const metadata: Metadata = {
  title: "音乐",
  description: "ReZenKi 的唱片目录——馆藏级排版，点击播放、切换与进度控制。",
};

/**
 * /music 播放页（v0.23.0）
 * - 由导航栏图标打开：圆环从图标半径向外覆盖全屏（见 circle-reveal.tsx）
 * - 内容：图录风格曲目清单 + 正在播放区；全局 <audio> 跨页不中断
 */
export default function MusicPage() {
  return <MusicPageClient />;
}
