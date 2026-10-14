import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/services/db";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    // Find the reset token
    const resetToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset link." },
        { status: 400 },
      );
    }

    // Check that this is a reset token
    if (!resetToken.identifier.startsWith("reset:")) {
      return NextResponse.json(
        { error: "Invalid or expired reset link." },
        { status: 400 },
      );
    }

    // Check expiry
    if (new Date() > resetToken.expires) {
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.json(
        { error: "This reset link has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Extract email from identifier
    const email = resetToken.identifier.replace("reset:", "");

    // Hash new password and update user
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { email },
        data: { passwordHash },
      });

      // Delete the used token
      await tx.verificationToken.delete({ where: { token } });

      // Also delete any other reset tokens for this email
      await tx.verificationToken.deleteMany({
        where: { identifier: `reset:${email}` },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    console.error("[Reset Password] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
