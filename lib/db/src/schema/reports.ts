import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reportsTable = pgTable("reports", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  description: text("description").notNull(),
  reporterContact: text("reporter_contact"),
  status: text("status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  reviewedBy: text("reviewed_by"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
});

export const insertReportSchema = createInsertSchema(reportsTable).omit({
  submittedAt: true,
  reviewedAt: true,
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;
