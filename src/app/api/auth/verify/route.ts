import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    // Find the verification token
    const verificationToken = await prisma.verification_tokens.findFirst({
      where: {
        token: token,
        expires_at: {
          gt: new Date()
        }
      }
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Begin transaction to update both tables
    await prisma.$transaction(async (tx) => {
      // Update user
      await tx.user.update({
        where: { id: verificationToken.user_id },
        data: {
          email_verified: now
        }
      });

      // Update auth.users
      await tx.users.update({
        where: { id: verificationToken.user_id },
        data: {
          email_confirmed_at: now,
          confirmation_token: null
        }
      });

      // Delete the verification token
      await tx.verification_tokens.delete({
        where: { id: verificationToken.id }
      });
    });

    return NextResponse.json({
      success: true,
      message: "Email verified successfully"
    });

  } catch (error: any) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
} 