import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("[auth] Missing credentials");
          return null;
        }
        let user;
        try {
          user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              userModuleAssignments: {
                include: { module: true },
              },
              memberProfile: { include: { workgroup: true, mentor: true } },
            },
          });
        } catch (e) {
          console.error("[auth] DB error:", e);
          return null;
        }
        if (!user) {
          console.error("[auth] User not found:", credentials.email);
          return null;
        }
        if (!user.passwordHash) {
          console.error("[auth] User has no password hash:", credentials.email);
          return null;
        }
        const ok = await compare(credentials.password, user.passwordHash);
        if (!ok) {
          console.error("[auth] Password mismatch for:", credentials.email);
          return null;
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isSuperAdmin: user.isSuperAdmin,
          status: user.status,
          modules: user.userModuleAssignments.map((a) => ({
            code: a.module.code,
            canView: a.canView,
            canCreate: a.canCreate,
            canEdit: a.canEdit,
            canDelete: a.canDelete,
            validUntil: a.validUntil?.toISOString() ?? null,
          })),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isSuperAdmin = (user as { isSuperAdmin?: boolean }).isSuperAdmin;
        token.status = (user as { status?: string }).status;
        token.modules = (user as { modules?: unknown }).modules;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { isSuperAdmin?: boolean }).isSuperAdmin = token.isSuperAdmin as boolean;
        (session.user as { status?: string }).status = token.status as string;
        (session.user as { modules?: unknown }).modules = token.modules;
      }
      return session;
    },
  },
};
