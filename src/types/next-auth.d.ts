import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organization?: string | null;
      role?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    organization?: string | null;
    role?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    organization?: string | null;
    role?: string | null;
  }
}
