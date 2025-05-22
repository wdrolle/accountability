import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string | null;
      name: string | null;
      role?: string;
      is_super_admin?: boolean;
    };
  }

  interface User {
    id: string;
    email: string | null;
    name: string | null;
    role?: string;
    is_super_admin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string | null;
    name: string | null;
    role?: string;
    is_super_admin?: boolean;
  }
} 