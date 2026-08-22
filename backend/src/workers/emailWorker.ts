import { Worker } from "bullmq";
import { redis } from "../config/redis.js";
import { pool } from "../config/db.js";
import { sendEmail } from "../config/mailer.js";

export const emailWorker = new Worker(
  "email-queue",

  async (job) => {
    const { emailId } = job.data;

    console.log(
      "Processing job:",
      job.id,
      new Date().toLocaleTimeString()
    );

    const result = await pool.query(
      `SELECT * FROM scheduled_emails
       WHERE id = $1`,
      [emailId]
    );

    if (result.rows.length === 0) {
      throw new Error(
        `Email ${emailId} not found`
      );
    }

    const email = result.rows[0];

    try {
      await sendEmail({
        to: email.recipient,
        subject: email.subject,
        text: email.body,
      });

      await pool.query(
        `UPDATE scheduled_emails
         SET status = 'sent',
             updated_at = NOW()
         WHERE id = $1`,
        [emailId]
      );

      console.log(
        "Email sent successfully:",
        emailId
      );

    } catch (error) {
      console.error(
        "Job failed:",
        emailId,
        error
      );

      await pool.query(
        `UPDATE scheduled_emails
         SET status = 'failed',
             updated_at = NOW()
         WHERE id = $1`,
        [emailId]
      );

      console.log(
        "Email marked as failed:",
        emailId
      );

      throw error;
    }
  },

  {
    connection: redis,
  }
);

emailWorker.on("ready", () => {
  console.log("Worker is ready");
});