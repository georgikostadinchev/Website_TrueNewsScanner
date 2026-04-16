import { Router } from "express";
import { randomUUID } from "crypto";
import { db, feedbackTable, checksTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

const VALID_RATINGS = ["helpful", "misleading", "inaccurate"] as const;
type Rating = (typeof VALID_RATINGS)[number];

router.post("/feedback", async (req, res) => {
  const { checkId, rating, comment } = req.body as {
    checkId: string;
    rating: string;
    comment?: string;
  };

  if (!checkId || !rating) {
    res.status(400).json({ error: "INVALID_INPUT", message: "Полетата checkId и rating са задължителни" });
    return;
  }

  if (!VALID_RATINGS.includes(rating as Rating)) {
    res.status(400).json({
      error: "INVALID_RATING",
      message: `Оценката трябва да е една от: ${VALID_RATINGS.join(", ")}`,
    });
    return;
  }

  const existing = await db.select({ id: checksTable.id }).from(checksTable).where(eq(checksTable.id, checkId)).limit(1);
  if (!existing[0]) {
    res.status(404).json({ error: "NOT_FOUND", message: "Проверката не е намерена" });
    return;
  }

  const id = randomUUID();
  await db.insert(feedbackTable).values({
    id,
    checkId,
    rating,
    comment: comment?.trim() || null,
  });

  res.status(201).json({
    id,
    message: "Благодарим за обратната връзка! Тя ни помага да подобрим системата.",
    createdAt: new Date().toISOString(),
  });
});

router.get("/feedback/:checkId/summary", async (req, res) => {
  const { checkId } = req.params;

  const existing = await db.select({ id: checksTable.id }).from(checksTable).where(eq(checksTable.id, checkId)).limit(1);
  if (!existing[0]) {
    res.status(404).json({ error: "NOT_FOUND", message: "Проверката не е намерена" });
    return;
  }

  const rows = await db
    .select({ rating: feedbackTable.rating, count: sql<number>`count(*)` })
    .from(feedbackTable)
    .where(eq(feedbackTable.checkId, checkId))
    .groupBy(feedbackTable.rating);

  const summary: Record<string, number> = { helpful: 0, misleading: 0, inaccurate: 0 };
  let total = 0;
  for (const row of rows) {
    const r = row.rating as keyof typeof summary;
    if (r in summary) {
      summary[r] = Number(row.count);
      total += Number(row.count);
    }
  }

  res.json({ checkId, total, ratings: summary });
});

export default router;
