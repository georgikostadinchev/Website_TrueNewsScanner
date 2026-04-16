import { Router } from "express";
import { db, checksTable, reportsTable, feedbackTable } from "@workspace/db";
import { sql, eq } from "drizzle-orm";

const router = Router();

router.get("/stats/public", async (_req, res) => {
  const [totalRow] = await db.select({ count: sql<number>`count(*)` }).from(checksTable);
  const total = Number(totalRow?.count ?? 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [todayRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(checksTable)
    .where(sql`checked_at >= ${today.toISOString()}`);
  const todayCount = Number(todayRow?.count ?? 0);

  const [scamRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(checksTable)
    .where(eq(checksTable.verdict, "scam"));
  const scamCount = Number(scamRow?.count ?? 0);

  const [suspiciousRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(checksTable)
    .where(eq(checksTable.verdict, "suspicious"));
  const suspiciousCount = Number(suspiciousRow?.count ?? 0);

  const [safeRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(checksTable)
    .where(eq(checksTable.verdict, "safe"));
  const safeCount = Number(safeRow?.count ?? 0);

  const typeRows = await db
    .select({ type: checksTable.type, count: sql<number>`count(*)` })
    .from(checksTable)
    .groupBy(checksTable.type);

  const byType: Record<string, number> = { url: 0, phone: 0, message: 0, news: 0 };
  for (const r of typeRows) {
    if (r.type in byType) byType[r.type] = Number(r.count);
  }

  const verdictRows = await db
    .select({ verdict: checksTable.verdict, count: sql<number>`count(*)` })
    .from(checksTable)
    .groupBy(checksTable.verdict);

  const byVerdict: Record<string, number> = { safe: 0, insufficient: 0, suspicious: 0, misleading: 0, scam: 0 };
  for (const r of verdictRows) {
    if (r.verdict in byVerdict) byVerdict[r.verdict] = Number(r.count);
  }

  const [reportsTotalRow] = await db.select({ count: sql<number>`count(*)` }).from(reportsTable);
  const reportsTotal = Number(reportsTotalRow?.count ?? 0);

  const [reportsReviewedRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(reportsTable)
    .where(eq(reportsTable.status, "reviewed"));
  const reportsReviewed = Number(reportsReviewedRow?.count ?? 0);

  const [feedbackTotalRow] = await db.select({ count: sql<number>`count(*)` }).from(feedbackTable);
  const feedbackTotal = Number(feedbackTotalRow?.count ?? 0);

  const [helpfulRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(feedbackTable)
    .where(eq(feedbackTable.rating, "helpful"));
  const helpfulCount = Number(helpfulRow?.count ?? 0);

  const accuracyRate = feedbackTotal > 0 ? Math.round((helpfulCount / feedbackTotal) * 100) : null;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const dailyRows = await db
    .select({
      day: sql<string>`date_trunc('day', checked_at)::date::text`,
      count: sql<number>`count(*)`,
    })
    .from(checksTable)
    .where(sql`checked_at >= ${sevenDaysAgo.toISOString()}`)
    .groupBy(sql`date_trunc('day', checked_at)`)
    .orderBy(sql`date_trunc('day', checked_at)`);

  const dailyTrend = dailyRows.map((r) => ({ date: r.day, count: Number(r.count) }));

  const riskRate = total > 0 ? Math.round(((scamCount + suspiciousCount) / total) * 100) : 0;

  res.json({
    totalChecks: total,
    todayChecks: todayCount,
    scamsDetected: scamCount,
    suspiciousDetected: suspiciousCount,
    safeCount,
    riskRate,
    byType,
    byVerdict,
    community: {
      totalReports: reportsTotal,
      reviewedReports: reportsReviewed,
    },
    feedback: {
      total: feedbackTotal,
      helpful: helpfulCount,
      accuracyRate,
    },
    dailyTrend,
  });
});

export default router;
