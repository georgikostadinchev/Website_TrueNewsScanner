import { Router } from "express";
import { randomUUID } from "crypto";
import { db, reportsTable } from "@workspace/db";

const router = Router();

router.post("/report", async (req, res) => {
  const { type, content, description, reporterContact } = req.body as {
    type: string;
    content: string;
    description: string;
    reporterContact?: string;
  };

  if (!type || !content || !description) {
    res.status(400).json({ error: "INVALID_INPUT", message: "Полетата type, content и description са задължителни" });
    return;
  }

  const validTypes = ["url", "phone", "message", "news"];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: "INVALID_TYPE", message: `Типът трябва да е един от: ${validTypes.join(", ")}` });
    return;
  }

  const id = randomUUID();
  await db.insert(reportsTable).values({
    id,
    type,
    content: content.trim(),
    description: description.trim(),
    reporterContact: reporterContact?.trim() || null,
    status: "pending",
  });

  const submittedAt = new Date().toISOString();

  res.status(201).json({
    id,
    message: "Вашият доклад беше получен успешно. Благодарим ви, че помагате да защитим общността!",
    submittedAt,
  });
});

export default router;
