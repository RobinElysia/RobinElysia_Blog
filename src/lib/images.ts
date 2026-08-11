import { db } from "@/lib/db";
import { images } from "@/lib/schema";
import { eq } from "drizzle-orm";

/** 图片数据访问层（见 .harness/api/route-handlers.md） */

export async function getImageById(id: number) {
  const [row] = await db.select().from(images).where(eq(images.id, id)).limit(1);
  return row ?? null;
}
