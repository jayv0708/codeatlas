import { NextResponse } from "next/server";

import { prisma } from "@/services/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/login?error=Verification", req.url),
      );
    }

    // Find the verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.redirect(
        new URL("/login?error=Verification", req.url),
      );
    }

    // Check expiry
    if (new Date() > verificationToken.expires) {
      // Clean up expired token
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.redirect(
        new URL("/login?error=Verification", req.url),
      );
    }

    // Mark email as verified
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    // Delete the token (single use)
    await prisma.verificationToken.delete({ where: { token } });

    return NextResponse.redirect(
      new URL("/login?verified=true", req.url),
    );
  } catch (error) {
    console.error("[Verify Email] Error:", error);
    return NextResponse.redirect(
      new URL("/login?error=Verification", req.url),
    );
  }
}
