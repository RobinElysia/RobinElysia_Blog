"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

/**
 * 可放大图片：点击后全屏 overlay 展示（黑白模式、Esc/点击关闭）
 * 见 motion-and-interaction.md「交互类」——克制淡入，无彩色
 */
export function ZoomableImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- MDX 图片动态 src，next/image 不适用 */}
      <img
        {...props}
        onClick={() => setOpen(true)}
        className="my-6 cursor-zoom-in border border-line"
        alt={props.alt ?? ""}
      />
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="图片放大预览"
            className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-paper/95 backdrop-blur-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- 同放大来源 */}
            <img
              {...props}
              className="max-h-[90vh] max-w-[90vw] border border-line"
              alt={props.alt ?? ""}
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="关闭预览"
              className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper transition-colors hover:border-ink"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
