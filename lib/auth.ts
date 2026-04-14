import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  username: z.string().min(3, "Введите корректный логин"),
  password: z.string().min(6, "Введите корректный пароль"),
});

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Локальная авторизация",
      credentials: {
        username: { label: "Логин", type: "text" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsedCredentials = credentialsSchema.safeParse(rawCredentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { username, password } = parsedCredentials.data;

        const user = await prisma.user.findUnique({
          where: { username },
          select: {
            id: true,
            username: true,
            fullName: true,
            passwordHash: true,
            role: true,
            isActive: true,
            restaurantId: true,
            restaurant: {
              select: {
                name: true,
                isActive: true,
              },
            },
          },
        });

        if (!user || !user.isActive) {
          return null;
        }

        if (user.role === "MANAGER" && (!user.restaurantId || !user.restaurant?.isActive)) {
          return null;
        }

        const passwordMatches = await compare(password, user.passwordHash);

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          name: user.fullName,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          restaurantId: user.restaurantId,
          restaurantName: user.restaurant?.name ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.fullName = user.fullName;
        token.role = user.role;
        token.restaurantId = user.restaurantId ?? null;
        token.restaurantName = user.restaurantName ?? null;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.username = token.username ?? "";
        session.user.fullName = token.fullName ?? token.username ?? "";
        session.user.role = token.role ?? "MANAGER";
        session.user.restaurantId = token.restaurantId ?? null;
        session.user.restaurantName = token.restaurantName ?? null;
      }

      return session;
    },
  },
};
