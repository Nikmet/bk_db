import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: "ADMIN" | "MANAGER";
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    username: string;
    role: "ADMIN" | "MANAGER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    role?: "ADMIN" | "MANAGER";
  }
}
