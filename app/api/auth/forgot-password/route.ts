import { NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/services/db";
import { sendEmail } from "@/lib/email";
import { resetPasswordEmail } from "@/lib/email-templates";

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({
        success: true,
        message: "If an account exists for this email, you will receive password reset instructions.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return the same message to prevent enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists for this email, you will receive password reset instructions.",
      });
    }

    // Only allow reset for password-based accounts
    if (!user.passwordHash) {
      return NextResponse.json({
        success: true,
        message: "If an account exists for this email, you will receive password reset instructions.",
      });
    }

    // Delete any existing reset tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: `reset:${normalizedEmail}` },
    });

    // Create new reset token
    const token = generateToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.verificationToken.create({
      data: {
        identifier: `reset:${normalizedEmail}`,
        token,
        expires,
      },
    });

    // Send reset email
    const emailContent = resetPasswordEmail(user.name, token);
    sendEmail({
      to: normalizedEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    }).catch((err) => console.error("[Forgot Password] Email send failed:", err));

    return NextResponse.json({
      success: true,
      message: "If an account exists for this email, you will receive password reset instructions.",
    });
  } catch (error) {
    console.error("[Forgot Password] Error:", error);
    return NextResponse.json({
      success: true,
      message: "If an account exists for this email, you will receive password reset instructions.",
    });
  }
}
