import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createHash } from "crypto";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Hash the token to match what's stored in the database
    const tokenHash = createHash('sha256').update(token).digest('hex');

    // Find the verification token in one_time_tokens
    const verificationToken = await prisma.one_time_tokens.findFirst({
      where: {
        token_hash: tokenHash,
        token_type: 'confirmation_token'
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
      // Update auth.users
      await tx.users.update({
        where: { id: verificationToken.user_id },
        data: {
          email_confirmed_at: now,
          confirmed_at: now,
          confirmation_token: null
        }
      });

      // Update accountability user if exists
      const accountabilityUser = await tx.user.findUnique({
        where: { id: verificationToken.user_id }
      });

      if (accountabilityUser) {
        await tx.user.update({
          where: { id: verificationToken.user_id },
          data: {
            updated_at: now
          }
        });
      }

      // Delete the verification token
      await tx.one_time_tokens.delete({
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