import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return new NextResponse("Missing Fields", { status: 400 });
  }

  const user = await prisma.users.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error("Email does not exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await prisma.users.update({
      where: {
        email,
      },
      data: {
        encrypted_password: hashedPassword,
        recovery_token: null,
        recovery_sent_at: null,
      },
    });

    return NextResponse.json("Password Updated", { status: 200 });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
