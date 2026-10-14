const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

function emailShell(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#111113;border-radius:16px;border:1px solid #222225;overflow:hidden;">
        <!-- Header -->
        <tr><td style="padding:32px 32px 0;text-align:center;">
          <div style="display:inline-block;background:#ff4d00;width:40px;height:40px;border-radius:10px;line-height:40px;text-align:center;">
            <span style="color:white;font-weight:bold;font-size:20px;">C</span>
          </div>
          <h1 style="color:#f4f4f5;font-size:20px;font-weight:700;margin:16px 0 0;letter-spacing:-0.02em;">CodeAtlas</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:24px 32px 32px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:0 32px 24px;border-top:1px solid #222225;">
          <p style="color:#52525b;font-size:11px;text-align:center;margin:16px 0 0;">
            &copy; ${new Date().getFullYear()} CodeAtlas. All rights reserved.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function verificationEmail(name: string | null, token: string): { subject: string; html: string; text: string } {
  const verifyUrl = `${BASE_URL}/verify-email?token=${token}`;
  return {
    subject: "Verify your CodeAtlas email",
    text: `Welcome to CodeAtlas! Please verify your email by visiting: ${verifyUrl}`,
    html: emailShell(`
      <h2 style="color:#f4f4f5;font-size:18px;font-weight:600;margin:0 0 8px;">Welcome to CodeAtlas${name ? `, ${name}` : ""}</h2>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Thanks for signing up. Please verify your email address to get started.
      </p>
      <a href="${verifyUrl}" style="display:inline-block;background:#ff4d00;color:white;font-weight:600;font-size:14px;padding:12px 32px;border-radius:10px;text-decoration:none;">
        Verify Email
      </a>
      <p style="color:#71717a;font-size:12px;line-height:1.5;margin:24px 0 0;">
        This link expires in 24 hours. If you did not create an account, you can safely ignore this email.
      </p>
    `),
  };
}

export function resetPasswordEmail(name: string | null, token: string): { subject: string; html: string; text: string } {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;
  return {
    subject: "Reset your CodeAtlas password",
    text: `You requested a password reset. Visit: ${resetUrl}`,
    html: emailShell(`
      <h2 style="color:#f4f4f5;font-size:18px;font-weight:600;margin:0 0 8px;">Reset your password</h2>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 24px;">
        ${name ? `Hi ${name}, ` : ""}We received a request to reset your CodeAtlas password. Click the button below to set a new one.
      </p>
      <a href="${resetUrl}" style="display:inline-block;background:#ff4d00;color:white;font-weight:600;font-size:14px;padding:12px 32px;border-radius:10px;text-decoration:none;">
        Reset Password
      </a>
      <p style="color:#71717a;font-size:12px;line-height:1.5;margin:24px 0 0;">
        This link expires in 1 hour. If you did not request this, you can safely ignore this email — your password will remain unchanged.
      </p>
    `),
  };
}
