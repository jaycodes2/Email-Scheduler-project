import type { Request, Response } from "express";
import { pool } from "../config/db.js";
import { emailQueue } from "../queues/emailQueue.js";

export const createEmail = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      recipients,
      subject,
      body,
      scheduledAt,
      delayBetween,
      hourlyLimit,
    } = req.body;

    let parsedRecipients: string[];

    try {
      parsedRecipients =
        typeof recipients === "string"
          ? JSON.parse(recipients)
          : recipients;
    } catch {
      return res.status(400).json({
        error: "Invalid recipients format",
      });
    }

    if (
      !Array.isArray(parsedRecipients) ||
      parsedRecipients.length === 0
    ) {
      return res.status(400).json({
        error: "At least one recipient is required",
      });
    }

    if (!subject || !body || !scheduledAt) {
      return res.status(400).json({
        error: "Subject, body and scheduled time are required",
      });
    }

    const baseScheduledTime = new Date(
      scheduledAt
    ).getTime();

    if (Number.isNaN(baseScheduledTime)) {
      return res.status(400).json({
        error: "Invalid scheduled time",
      });
    }

    const delayInSeconds =
      Number(delayBetween) || 0;

    const hourlyLimitNumber =
      Number(hourlyLimit) || 0;

    const attachment = req.file;

    const createdEmails = [];

    for (let i = 0; i < parsedRecipients.length; i++) {
      const recipient = parsedRecipients[i];

      let emailScheduledTime: number;

      if (hourlyLimitNumber <= 0) {
        emailScheduledTime =
          baseScheduledTime +
          i * delayInSeconds * 1000;
      } else {
        const batch = Math.floor(
          i / hourlyLimitNumber
        );

        const positionInBatch =
          i % hourlyLimitNumber;

        emailScheduledTime =
          baseScheduledTime +
          batch * 60 * 60 * 1000 +
          positionInBatch *
            delayInSeconds *
            1000;
      }

      const result = await pool.query(
        `INSERT INTO scheduled_emails
        (
          recipient,
          subject,
          body,
          scheduled_at,
          attachment_name,
          attachment_path,
          attachment_type
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          recipient,
          subject,
          body,
          new Date(emailScheduledTime),
          attachment?.originalname ?? null,
          attachment?.path ?? null,
          attachment?.mimetype ?? null,
        ]
      );

      const email = result.rows[0];

      const jobDelay =
        new Date(email.scheduled_at).getTime() -
        Date.now();

      const job = await emailQueue.add(
        "send-email",
        {
          emailId: email.id,
        },
        {
          delay: Math.max(jobDelay, 0),
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
        }
      );

      createdEmails.push({
        email,
        jobId: job.id,
      });
    }

    res.status(201).json({
      message: "Emails scheduled successfully",
      emails: createdEmails,
    });
  } catch (error) {
    console.error("Failed to schedule emails:", error);

    res.status(500).json({
      error: "Failed to schedule emails",
    });
  }
};

export const getEmails = async (
  req: Request,
  res: Response
) => {
  try {
    const { status } = req.query;

    let query = "SELECT * FROM scheduled_emails";
    const values: string[] = [];

    if (status) {
      query += " WHERE status = $1";
      values.push(status as string);
    }

    query += " ORDER BY scheduled_at ASC";

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch emails",
    });
  }
};

export const toggleEmailStar = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE scheduled_emails
       SET starred = NOT starred,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Email not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to update email star",
    });
  }
};