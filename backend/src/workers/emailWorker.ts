import "dotenv/config";

import { Worker } from "bullmq";
import { redis } from "../config/redis.js";
import { pool } from "../config/db.js";
import { createMailer } from "../config/mailer.js";
import nodemailer from "nodemailer";

const maxEmailsPerHour = Number(
  process.env.MAX_EMAILS_PER_HOUR
);

const workerConcurrency = Number(
  process.env.WORKER_CONCURRENCY
);

if (!workerConcurrency || workerConcurrency <= 0) {
  throw new Error(
    "WORKER_CONCURRENCY must be set to a positive number"
  );
}

if (!maxEmailsPerHour || maxEmailsPerHour <= 0) {
  throw new Error(
    "MAX_EMAILS_PER_HOUR must be set to a positive number"
  );
}

const worker = new Worker(
  "email-queue",

  async (job) => {
    console.log(
      "Processing job:",
      job.id,
      new Date().toLocaleTimeString()
    );

    const { emailId } = job.data;

    const result = await pool.query(
      "SELECT * FROM scheduled_emails WHERE id = $1",
      [emailId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Email ${emailId} not found`);
    }

    const email = result.rows[0];

    const transporter = await createMailer();

    const attachments = email.attachment_path
      ? [
          {
            filename: email.attachment_name,
            path: email.attachment_path,
            contentType: email.attachment_type,
          },
        ]
      : [];

    const info = await transporter.sendMail({
      from: "Email Scheduler <scheduler@example.com>",
      to: email.recipient,
      subject: email.subject,
      text: email.body,
      attachments,
    });

    console.log("Email sent:", info.messageId);

    console.log(
      "Preview URL:",
      nodemailer.getTestMessageUrl(info)
    );

    await pool.query(
      `UPDATE scheduled_emails
       SET status = $1,
           updated_at = NOW()
       WHERE id = $2`,
      ["sent", emailId]
    );

    console.log("Email fetched from database:");
    console.log(email);
  },

  {
    connection: redis,

    concurrency: workerConcurrency,

    limiter: {
      max: maxEmailsPerHour,
      duration: 60 * 60 * 1000,
    },
  }
);

console.log("Email worker started");

worker.on("ready", () => {
  console.log("Worker is ready");
});

worker.on("error", (error) => {
  console.error("Worker error:", error);
});

worker.on("failed", async (job, error) => {
  console.error(
    "Job failed:",
    job?.id,
    error
  );

  if (!job) return;

  if (
    job.attemptsMade >=
    (job.opts.attempts ?? 1)
  ) {
    const { emailId } = job.data;

    await pool.query(
      `UPDATE scheduled_emails
       SET status = $1,
           updated_at = NOW()
       WHERE id = $2`,
      ["failed", emailId]
    );

    console.log(
      "Email marked as failed:",
      emailId
    );
  }
});

worker.on("completed", (job) => {
  console.log("Job completed:", job.id);
});