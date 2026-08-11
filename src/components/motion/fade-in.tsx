"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * 进入视口淡入上移动画（motion）
 * 约束（见 motion-and-interaction.md）：
 * - 位移 ≤ 16px，easeOutQuint 缓动，只播一次（once）
 * - 必须是独立 Client 组件，禁止为整页标 'use client'
 */
export function FadeIn({
  children,
  delay = 0,
  y = 12,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
