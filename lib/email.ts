import { Resend } from "resend";
import nodemailer from "nodemailer";

let _transporter: nodemailer.Transporter | null = null;

/**
 * Send an email using the best available provider.
 *
 * Priority:
 * 1. Resend API (RESEND_API_KEY) — simplest, most reliable
 * 2. SMTP (SMTP_HOST + SMTP_USER + SMTP_PASSWORD) — production SMTP
 * 3. Gmail SMTP (SMTP_USER + SMTP_PASSWORD as App Password)
 * 4. Ethereal — dev only, no real delivery
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: string }> {
  const startTime = Date.now();
  const from = process.env.EMAIL_FROM || "CodeAtlas <noreply@codeatlas.dev>";

  // 1. Resend API (if key is set)
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      const result = await resend.emails.send({
        from,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      const duration = Date.now() - startTime;
      if (result.error) {
        console.error(`[Email] Resend error after ${duration}ms:`, result.error);
        return { success: false, error: result.error.message };
      }

      console.log(`[Email] Resend → ${options.to.split("@")[1]} in ${duration}ms — id: ${result.data?.id}`);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[Email] Resend failed: ${msg}`);
      // Fall through to SMTP
    }
  }

  // 2/3. SMTP transport (Custom or Gmail)
  try {
    const transporter = await getSmtpTransporter();
    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    const duration = Date.now() - startTime;
    console.log(`[Email] SMTP → ${options.to.split("@")[1]} in ${duration}ms — id: ${info.messageId}`);

    let previewUrl: string | undefined;
    if (process.env.NODE_ENV !== "production" && info.messageId) {
      const url = nodemailer.getTestMessageUrl(info);
      if (url) previewUrl = url;
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Email] SMTP failed: ${msg}`);
    return { success: false, error: msg };
  }
}

async function getSmtpTransporter(): Promise<nodemailer.Transporter> {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (host && user && pass) {
    _transporter = nodemailer.createTransport({
      host,
      port: port ? parseInt(port, 10) : 587,
      secure: port === "465",
      auth: { user, pass },
    });
    console.log("[Email] Using custom SMTP:", host);
    return _transporter;
  }

  if (user && pass) {
    _transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
    console.log("[Email] Using Gmail SMTP for:", user);
    return _transporter;
  }

  // Ethereal fallback
  console.warn("[Email] No email provider configured. Set RESEND_API_KEY or SMTP_USER+SMTP_PASSWORD in .env.local");
  const testAccount = await nodemailer.createTestAccount();
  _transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  console.log("[Email] Using Ethereal (no real delivery). Preview:", testAccount.user);
  return _transporter;
}
