import { Router } from "express";
import { randomUUID } from "crypto";
import { db } from "@workspace/db";
import { checksTable, reportsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { checkUrl } from "../lib/pipeline/url";
import { checkPhone } from "../lib/pipeline/phone";
import { checkMessage } from "../lib/pipeline/message";
import { checkNews } from "../lib/pipeline/news";
import { computeScore, normalizeForMatch, isAllowlisted } from "../lib/scoring/engine";
import type { CommunityData } from "../lib/scoring/engine";
import type { Signal, Evidence, NextStep } from "../lib/pipeline/types";

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

  const trimmedInput = input.trim();

  // 1. Run the pipeline — always runs heuristic, tries AI as advisory
  let pipeline;
  if (type === "url") pipeline = checkUrl;
  else if (type === "phone") pipeline = checkPhone;
  else if (type === "message") pipeline = checkMessage;
  else pipeline = checkNews;

  const raw = await pipeline(trimmedInput);

  // 2. Community report lookup (exact match for url and phone only)
  const communityData: CommunityData = { reviewedScam: 0, pending: 0, dismissed: 0 };
  let exactMatchReviewed = false;

  if (type === "url" || type === "phone") {
    const normalizedInput = normalizeForMatch(type, trimmedInput);
    const reports = await db.select().from(reportsTable).where(eq(reportsTable.type, type));

    for (const report of reports) {
      if (normalizeForMatch(type, report.content) !== normalizedInput) continue;
      if (report.status === "reviewed") {
        communityData.reviewedScam++;
        exactMatchReviewed = true;
      } else if (report.status === "pending") {
        communityData.pending++;
      } else if (report.status === "dismissed") {
        communityData.dismissed++;
      }
    }
  }

  // 3. Scoring engine: merge heuristic + AI + community + allowlist
  const scoring = computeScore({
    heuristicScore: raw.heuristicScore,
    heuristicSignals: raw.heuristicSignals,
    aiScore: raw.aiScore,
    aiSignals: raw.aiSignals,
    aiAvailable: raw.aiAvailable,
    community: communityData,
    exactMatchReviewed,
    isAllowlisted: isAllowlisted(type, trimmedInput),
  });

  // 4. Merge signals: heuristic → AI → scoring adjustments
  const signals: Signal[] = [
    ...raw.heuristicSignals,
    ...(raw.aiSignals ?? []),
    ...scoring.scoringSignals,
  ];

  // 5. Prefer AI-generated prose; fall back to heuristic-generated prose
  const summary: string = raw.aiSummary ?? raw.heuristicSummary;
  const evidence: Evidence[] = raw.aiEvidence ?? raw.heuristicEvidence;
  const nextSteps: NextStep[] = raw.aiNextSteps ?? raw.heuristicNextSteps;

  const id = randomUUID();
  const row = {
    id,
    type,
    input: trimmedInput,
    verdict: scoring.verdict,
    verdictLabel: scoring.verdictLabel,
    riskScore: scoring.riskScore,
    confidence: scoring.confidence,
    summary,
    signals,
    evidence,
    nextSteps,
  };

  await db.insert(checksTable).values(row);

  res.json({ ...row, checkedAt: new Date().toISOString() });
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
