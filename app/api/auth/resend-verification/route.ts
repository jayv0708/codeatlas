import { NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/services/db";
import { sendEmail } from "@/lib/email";
import { verificationEmail } from "@/lib/email-templates";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({
        success: true,
        message: "If an unverified account exists for this email, a verification link has been sent.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return same message to prevent enumeration
    if (!user || user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: "If an unverified account exists for this email, a verification link has been sent.",
      });
    }

    // Delete old verification tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: normalizedEmail },
    });

    // Create new verification token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: { identifier: normalizedEmail, token, expires },
    });

    // Send verification email (awaited)
    const emailContent = verificationEmail(user.name, token);
    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (!emailResult.success) {
      return NextResponse.json({
        success: false,
        error: "We could not send the verification email right now. Please try again later.",
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent. Check your inbox.",
    });
  } catch (error) {
    console.error("[Resend Verification] Error:", error);
    return NextResponse.json({
      success: true,
      message: "If an unverified account exists for this email, a verification link has been sent.",
    });
  }
}
