import nodemailer from "nodemailer";

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
}

export async function sendEmail({
  to,
  subject,
  text,
}: SendEmailParams) {
  const response = await fetch(
    "https://api.brevo.com/v3/smtp/email",
    {
      method: "POST",

      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": process.env.BREVO_API_KEY!,
      },

      body: JSON.stringify({
        sender: {
          email: process.env.EMAIL_USER!,
          name: "ONB Email Scheduler",
        },

        to: [
          {
            email: to,
          },
        ],

        subject,

        textContent: text,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();

    throw new Error(
      `Brevo failed: ${response.status} ${error}`
    );
  }

  return response.json();
}