import { AuthOptions, NextAuthOptions } from "next-auth";
import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import { compare } from "bcryptjs";
import { authCookieOptions, useSecureAuthCookies } from "./auth-cookie-security";

declare module "next-auth" {
  interface User {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
    role?: string;
    is_super_admin?: boolean;
  }

  interface Session {
    user: User & {
      id: string;
      role?: string;
      is_super_admin?: boolean;
    };
  }
}

const providers: NextAuthOptions["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  providers: [
    ...providers,
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.users.findUnique({
          where: {
            email: credentials.email.toLowerCase(),
          }
        });

        if (!user || !user.encrypted_password) {
          return null;
        }

        const passwordValid = await compare(
          credentials.password,
          user.encrypted_password
        );

        if (!passwordValid) {
          return null;
        }

        const userData = user.raw_user_meta_data as { first_name?: string; last_name?: string } | null;
        const name = userData ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || null : null;

        return {
          id: user.id,
          email: user.email || null,
          name,
          image: null,
          role: user.role || undefined,
          is_super_admin: user.is_super_admin || false
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
          is_super_admin: user.is_super_admin
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || session.user.id;
        session.user.role = (token.role as string) || session.user.role;
        session.user.is_super_admin = Boolean(token.is_super_admin);
        try {
          const authUser = await prisma.users.findUnique({
            where: {
              email: session.user.email || undefined
            },
            select: {
              id: true,
              role: true,
              is_super_admin: true
            }
          });

          if (authUser) {
            session.user.id = authUser.id;
            session.user.role = authUser.role?.toString() || session.user.role;
            session.user.is_super_admin = authUser.is_super_admin || session.user.is_super_admin || false;
          }
        } catch (error) {
          console.error("session auth.users lookup:", error);
        }
      }
      return session;
    }
  },
  pages: {
    signIn: '/api/auth/hub-signin',
  },
  session: {
    strategy: 'jwt',
  },
  useSecureCookies: useSecureAuthCookies(),
  cookies: authCookieOptions(),
  secret: process.env.NEXTAUTH_SECRET,
}; 