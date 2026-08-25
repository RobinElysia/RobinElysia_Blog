/**
 * 音乐曲目清单（v0.23.0）——静态映射，不动 DB（与 archive-images.ts 同模式）
 * 文件在 public/music/*.mp3；时长由 ffprobe 实测（2026-08-22）
 */
export type MusicTrack = {
  /** 目录号（两位数字，图录式排版） */
  id: string;
  title: string;
  artist: string;
  src: string;
  /** 秒 */
  duration: number;
};

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: "01",
    title: "卡农",
    artist: "中国爱乐乐团 · 瑞鸣音乐",
    src: "/music/中国爱乐乐团·瑞鸣音乐 - 卡农.mp3",
    duration: 319,
  },
  {
    id: "02",
    title: "Variations On The Canon By Pachelbel",
    artist: "George Winston",
    src: "/music/George Winston - Variations On The Canon By Pachelbel.mp3",
    duration: 323,
  },
  {
    id: "03",
    title: "Concerto For Piano And Orchestra No. 5 In F Minor, BWV 1056 II. Largo",
    artist: "Glenn Gould · Columbia Symphony Orchestra",
    src: "/music/Glenn Gould·Vladimir Golschmann·Columbia Symphony Orchestra - Concerto For Piano And Orchestra No. 5 In F Minor, BWV 1056II. Largo.mp3",
    duration: 176,
  },
  {
    id: "04",
    title: "Villanelle",
    artist: "Jo Blankenburg",
    src: "/music/Jo Blankenburg - Villanelle.mp3",
    duration: 236,
  },
  {
    id: "05",
    title: "Light Dance",
    artist: "小瀬村晶",
    src: "/music/小瀬村晶 - Light Dance.mp3",
    duration: 289,
  },
  {
    id: "06",
    title: "Summer Ghost",
    artist: "小瀬村晶",
    src: "/music/小瀬村晶 - Summer Ghost.mp3",
    duration: 136,
  },
  {
    id: "07",
    title: "You and Me",
    artist: "小瀬村晶",
    src: "/music/小瀬村晶 - You and Me.mp3",
    duration: 129,
  },
  {
    id: "08",
    title: "跨越千年的约定",
    artist: "YCE丶奇迹",
    src: "/music/YCE丶奇迹 - 跨越千年的约定.mp3",
    duration: 161,
  },
  {
    id: "09",
    title: "Flying Free",
    artist: "Vancouver Children's Choir · Andrew Dawes",
    src: "/music/Vancouver Childrens Choir·Andrew Dawes - Flying Free.mp3",
    duration: 211,
  },
  {
    id: "10",
    title: "Someone in the crowd",
    artist: "雷米克斯",
    src: "/music/雷米克斯 - Someone in the crowd.mp3",
    duration: 116,
  },
];
