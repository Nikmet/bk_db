import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      fullName: string;
      role: "ADMIN" | "MANAGER";
      restaurantId?: string | null;
      restaurantName?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    username: string;
    fullName: string;
    role: "ADMIN" | "MANAGER";
    restaurantId?: string | null;
    restaurantName?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    fullName?: string;
    role?: "ADMIN" | "MANAGER";
    restaurantId?: string | null;
    restaurantName?: string | null;
  }
}
