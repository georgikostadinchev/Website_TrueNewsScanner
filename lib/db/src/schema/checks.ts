import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const checksTable = pgTable("checks", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  input: text("input").notNull(),
  verdict: text("verdict").notNull(),
  verdictLabel: text("verdict_label").notNull(),
  riskScore: integer("risk_score").notNull(),
  confidence: integer("confidence").notNull(),
  summary: text("summary").notNull(),
  signals: jsonb("signals").notNull(),
  evidence: jsonb("evidence").notNull(),
  nextSteps: jsonb("next_steps").notNull(),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
});

export const insertCheckSchema = createInsertSchema(checksTable).omit({
  checkedAt: true,
});

export type InsertCheck = z.infer<typeof insertCheckSchema>;
export type Check = typeof checksTable.$inferSelect;
