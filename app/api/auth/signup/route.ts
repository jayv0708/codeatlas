import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { prisma } from "@/services/db";
import { sendEmail } from "@/lib/email";
import { verificationEmail } from "@/lib/email-templates";

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    // Check existing user
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      // Return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: "If an account exists for this email, a verification link has been sent.",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user + verification token in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name?.trim() || null,
          email: normalizedEmail,
          passwordHash,
        },
      });

      const token = generateToken();
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await tx.verificationToken.create({
        data: {
          identifier: normalizedEmail,
          token,
          expires,
        },
      });

      return { user, token };
    });

    // Send verification email (awaited — fail if email can't be sent)
    const emailContent = verificationEmail(name || null, result.token);
    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (!emailResult.success) {
      console.error("[Signup] Email send failed:", emailResult.error);
      // User was created but email failed — still return success with a note
      // (user can use Resend Verification to try again)
      return NextResponse.json({
        success: true,
        message: "Account created. We could not send the verification email right now. Please use 'Resend Verification' from the login page.",
        userId: result.user.id,
        emailFailed: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Account created. Please check your email to verify your account.",
      userId: result.user.id,
    });
  } catch (error) {
    console.error("[Signup] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
