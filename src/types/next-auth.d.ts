import "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    isSuperAdmin?: boolean;
    status?: string;
    modules?: Array<{
      code: string;
      canView: boolean;
      canCreate: boolean;
      canEdit: boolean;
      canDelete: boolean;
      validUntil: string | null;
    }>;
  }

  interface Session {
    user: User & { id: string };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    isSuperAdmin?: boolean;
    status?: string;
    modules?: unknown;
  }
}
