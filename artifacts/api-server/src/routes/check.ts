import { Router } from "express";
import { randomUUID } from "crypto";
import { db } from "@workspace/db";
import { checksTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { checkUrl } from "../lib/pipeline/url";
import { checkPhone } from "../lib/pipeline/phone";
import { checkMessage } from "../lib/pipeline/message";
import { checkNews } from "../lib/pipeline/news";

const router = Router();

router.post("/check", async (req, res) => {
  const { type, input } = req.body as { type: string; input: string };

  if (!type || !input) {
    res.status(400).json({ error: "INVALID_INPUT", message: "Полетата type и input са задължителни" });
    return;
  }

  const validTypes = ["url", "phone", "message", "news"];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: "INVALID_TYPE", message: `Типът трябва да е един от: ${validTypes.join(", ")}` });
    return;
  }

  if (typeof input !== "string" || input.trim().length < 2) {
    res.status(400).json({ error: "INVALID_INPUT", message: "Въведеното съдържание е твърде кратко" });
    return;
  }

  let pipeline;
  if (type === "url") pipeline = checkUrl;
  else if (type === "phone") pipeline = checkPhone;
  else if (type === "message") pipeline = checkMessage;
  else pipeline = checkNews;

  const pipelineResult = await pipeline(input.trim());

  const id = randomUUID();
  const row = {
    id,
    type,
    input: input.trim(),
    verdict: pipelineResult.verdict,
    verdictLabel: pipelineResult.verdictLabel,
    riskScore: pipelineResult.riskScore,
    confidence: pipelineResult.confidence,
    summary: pipelineResult.summary,
    signals: pipelineResult.signals,
    evidence: pipelineResult.evidence,
    nextSteps: pipelineResult.nextSteps,
  };

  await db.insert(checksTable).values(row);

  const result = {
    ...row,
    checkedAt: new Date().toISOString(),
  };

  res.json(result);
});

router.get("/checks/recent", async (_req, res) => {
  const totalResult = await db.select({ count: sql<number>`count(*)` }).from(checksTable);
  const total = Number(totalResult[0]?.count ?? 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayResult = await db.select({ count: sql<number>`count(*)` }).from(checksTable)
    .where(sql`checked_at >= ${today.toISOString()}`);
  const todayCount = Number(todayResult[0]?.count ?? 0);

  const scamResult = await db.select({ count: sql<number>`count(*)` }).from(checksTable)
    .where(eq(checksTable.verdict, "scam"));
  const scamCount = Number(scamResult[0]?.count ?? 0);

  const typeRows = await db.select({ type: checksTable.type, count: sql<number>`count(*)` })
    .from(checksTable)
    .groupBy(checksTable.type);

  const byType = { url: 0, phone: 0, message: 0, news: 0 };
  for (const r of typeRows) {
    const t = r.type as keyof typeof byType;
    if (t in byType) byType[t] = Number(r.count);
  }

  const verdictRows = await db.select({ verdict: checksTable.verdict, count: sql<number>`count(*)` })
    .from(checksTable)
    .groupBy(checksTable.verdict);

  const byVerdict = { safe: 0, insufficient: 0, suspicious: 0, misleading: 0, scam: 0 };
  for (const r of verdictRows) {
    const v = r.verdict as keyof typeof byVerdict;
    if (v in byVerdict) byVerdict[v] = Number(r.count);
  }

  res.json({
    totalChecks: total,
    todayChecks: todayCount,
    scamsDetected: scamCount,
    byType,
    byVerdict,
  });
});

export default router;
