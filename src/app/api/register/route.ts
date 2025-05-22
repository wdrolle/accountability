// src/app/api/register/route.ts

import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail, getVerificationEmailHtml } from "@/lib/email";
import { randomBytes } from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Split name into first and last name
    const nameParts = name.trim().split(/\s+/);
    if (nameParts.length < 2) {
      return NextResponse.json(
        { error: "Please enter both your first and last name" },
        { status: 400 }
      );
    }

    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    // Check for existing user
    const existingUser = await prisma.users.findUnique({
      where: { 
        email: email.toLowerCase() 
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 12);
    const verificationToken = randomBytes(32).toString('hex');

    try {
      // Create user according to the exact schema
      const user = await prisma.users.create({
        data: {
          // Required fields from auth.users schema
          instance_id: null, // Optional UUID
          id: randomBytes(16).toString('hex'), // Generate UUID
          aud: 'authenticated',
          role: 'authenticated',
          email: email.toLowerCase(),
          encrypted_password: hashedPassword,
          email_confirmed_at: null,
          invited_at: null,
          confirmation_token: verificationToken,
          confirmation_sent_at: new Date(),
          recovery_token: null,
          recovery_sent_at: null,
          email_change_token_new: null,
          email_change: null,
          email_change_sent_at: null,
          last_sign_in_at: null,
          raw_app_meta_data: {},
          raw_user_meta_data: {
            first_name: firstName,
            last_name: lastName,
            subscription_plan: "starter",
            subscription_status: "TRIAL"
          },
          is_super_admin: false,
          created_at: new Date(),
          updated_at: new Date(),
          phone: null,
          phone_confirmed_at: null,
          phone_change: null,
          phone_change_token: null,
          phone_change_sent_at: null,
          confirmed_at: null,
          email_change_token_current: null,
          email_change_confirm_status: 0,
          banned_until: null,
          reauthentication_token: null,
          reauthentication_sent_at: null,
        }
      });

      // Send verification email
      const emailResult = await sendEmail(
        email,
        "Verify your CStudios account",
        getVerificationEmailHtml(firstName, verificationToken)
      );

      if (!emailResult.success) {
        console.error('Failed to send verification email');
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: `${firstName} ${lastName}`.trim()
        },
        message: "Registration successful! Please check your email to verify your account."
      });

    } catch (dbError: any) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
