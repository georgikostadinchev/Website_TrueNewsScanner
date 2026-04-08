import { Router } from "express";
import { db, reportsTable } from "@workspace/db";
import { eq, sql, and, inArray } from "drizzle-orm";

const router = Router();

router.get("/admin/reports", async (req, res) => {
  const { status, type, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  if (status && ["pending", "reviewed", "dismissed"].includes(status)) {
    conditions.push(eq(reportsTable.status, status));
  }
  if (type && ["url", "phone", "message", "news"].includes(type)) {
    conditions.push(eq(reportsTable.type, type));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult, rows] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(reportsTable).where(whereClause),
    db.select().from(reportsTable).where(whereClause)
      .orderBy(sql`submitted_at desc`)
      .limit(limitNum)
      .offset(offset),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  const reports = rows.map((r) => ({
    id: r.id,
    type: r.type,
    content: r.content,
    description: r.description,
    reporterContact: r.reporterContact,
    status: r.status,
    adminNotes: r.adminNotes,
    reviewedBy: r.reviewedBy,
    submittedAt: r.submittedAt.toISOString(),
    reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
  }));

  res.json({ reports, total, page: pageNum, limit: limitNum });
});

router.get("/admin/reports/:id", async (req, res) => {
  const { id } = req.params;
  const rows = await db.select().from(reportsTable).where(eq(reportsTable.id, id)).limit(1);

  if (rows.length === 0) {
    res.status(404).json({ error: "NOT_FOUND", message: "Докладът не е намерен" });
    return;
  }

  const r = rows[0];
  res.json({
    id: r.id,
    type: r.type,
    content: r.content,
    description: r.description,
    reporterContact: r.reporterContact,
    status: r.status,
    adminNotes: r.adminNotes,
    reviewedBy: r.reviewedBy,
    submittedAt: r.submittedAt.toISOString(),
    reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
  });
});

router.patch("/admin/reports/:id", async (req, res) => {
  const { id } = req.params;
  const { status, adminNotes, reviewedBy } = req.body as {
    status?: string;
    adminNotes?: string | null;
    reviewedBy?: string | null;
  };

  const rows = await db.select().from(reportsTable).where(eq(reportsTable.id, id)).limit(1);
  if (rows.length === 0) {
    res.status(404).json({ error: "NOT_FOUND", message: "Докладът не е намерен" });
    return;
  }

  const updates: Partial<typeof reportsTable.$inferInsert> = {};
  if (status && ["pending", "reviewed", "dismissed"].includes(status)) {
    updates.status = status;
    if (status !== "pending") {
      updates.reviewedAt = new Date();
    }
  }
  if (adminNotes !== undefined) updates.adminNotes = adminNotes;
  if (reviewedBy !== undefined) updates.reviewedBy = reviewedBy;

  if (Object.keys(updates).length > 0) {
    await db.update(reportsTable).set(updates).where(eq(reportsTable.id, id));
  }

  const updated = await db.select().from(reportsTable).where(eq(reportsTable.id, id)).limit(1);
  const r = updated[0];

  res.json({
    id: r.id,
    type: r.type,
    content: r.content,
    description: r.description,
    reporterContact: r.reporterContact,
    status: r.status,
    adminNotes: r.adminNotes,
    reviewedBy: r.reviewedBy,
    submittedAt: r.submittedAt.toISOString(),
    reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
  });
});

router.get("/admin/stats", async (_req, res) => {
  const [totalResult, pendingResult, reviewedResult, dismissedResult, typeRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(reportsTable),
    db.select({ count: sql<number>`count(*)` }).from(reportsTable).where(eq(reportsTable.status, "pending")),
    db.select({ count: sql<number>`count(*)` }).from(reportsTable).where(eq(reportsTable.status, "reviewed")),
    db.select({ count: sql<number>`count(*)` }).from(reportsTable).where(eq(reportsTable.status, "dismissed")),
    db.select({ type: reportsTable.type, count: sql<number>`count(*)` }).from(reportsTable).groupBy(reportsTable.type),
  ]);

  const reportsByType = { url: 0, phone: 0, message: 0, news: 0 };
  for (const r of typeRows) {
    const t = r.type as keyof typeof reportsByType;
    if (t in reportsByType) reportsByType[t] = Number(r.count);
  }

  // Recent activity last 7 days
  const recentActivity = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dEnd = new Date(d);
    dEnd.setDate(dEnd.getDate() + 1);
    const dayResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(reportsTable)
      .where(sql`submitted_at >= ${d.toISOString()} AND submitted_at < ${dEnd.toISOString()}`);
    recentActivity.push({
      date: d.toISOString().split("T")[0],
      count: Number(dayResult[0]?.count ?? 0),
    });
  }

  res.json({
    totalReports: Number(totalResult[0]?.count ?? 0),
    pendingReports: Number(pendingResult[0]?.count ?? 0),
    reviewedReports: Number(reviewedResult[0]?.count ?? 0),
    dismissedReports: Number(dismissedResult[0]?.count ?? 0),
    reportsByType,
    recentActivity,
  });
});

export default router;
