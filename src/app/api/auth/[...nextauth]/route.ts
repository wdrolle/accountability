import { AuthOptions } from "next-auth";
import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";
import { authCookieOptions, useSecureAuthCookies } from "@/lib/auth-cookie-security";

declare module "next-auth" {
  interface User {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
    role?: string;
    is_super_admin?: boolean;
    accessToken?: string;
  }

  interface Session {
    user: User & {
      id: string;
      role?: string;
      is_super_admin?: boolean;
    };
  }
}

const providers: AuthOptions["providers"] = [];

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

export const authOptions: AuthOptions = {
  providers: [
    ...providers,
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.users.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            encrypted_password: true,
            role: true,
            is_super_admin: true
          }
        });

        if (!user || !user.encrypted_password) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.encrypted_password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email || null,
          name: `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || null,
          image: null,
          role: user.role || undefined,
          is_super_admin: user.is_super_admin || false
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          const existingUser = await prisma.users.findFirst({
            where: {
              email: user.email || undefined
            }
          });

          if (!existingUser) {
            const names = user.name?.split(' ') || ['', ''];
            const firstName = names[0] || '';
            const lastName = names.slice(1).join(' ') || '';

            await prisma.users.create({
              data: {
                email: user.email!,
                first_name: firstName,
                last_name: lastName,
                role: "USER",
                raw_user_meta_data: {
                  subscription_plan: "starter",
                  profile_image: user.image,
                  subscription_status: "TRIAL"
                },
                users: {
                  connect: undefined
                }
              }
            });
          }
          return true;
        } catch (error) {
          console.error("Error during social sign in:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.is_super_admin = user.is_super_admin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || session.user.id;
        session.user.role = (token.role as string) || session.user.role;
        session.user.is_super_admin = Boolean(token.is_super_admin);
        try {
          const dbUser = await prisma.users.findUnique({
            where: {
              email: session.user.email || undefined
            },
            select: {
              id: true,
              role: true,
              is_super_admin: true
            }
          });

          if (dbUser) {
            session.user.id = dbUser.id;
            session.user.role = dbUser.role?.toString() || session.user.role;
            session.user.is_super_admin = dbUser.is_super_admin || session.user.is_super_admin || false;
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

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
