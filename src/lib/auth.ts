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
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            userModuleAssignments: {
              include: { module: true },
            },
            memberProfile: { include: { subGroup: true, mentor: true } },
          },
        });
        if (!user?.passwordHash) return null;
        const ok = await compare(credentials.password, user.passwordHash);
        if (!ok) return null;
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
