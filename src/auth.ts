import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // ── Google OAuth ──────────────────────────────────────────
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      async profile(profile) {
        // Find or create user from Google profile
        const email = profile.email as string;
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          // Generate a unique username from email prefix
          const base = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
          let username = base;
          let suffix = 1;
          while (await prisma.user.findUnique({ where: { username } })) {
            username = `${base}${suffix++}`;
          }

          user = await prisma.user.create({
            data: {
              username,
              email,
              image: profile.picture as string | undefined,
              preference: { create: { theme: "SYSTEM", currency: "INR" } },
            },
          });
        }

        return { id: user.id, name: user.username, email: user.email, image: user.image };
      },
    }),

    // ── Username / Password ───────────────────────────────────
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { username, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user || !user.passwordHash) return null;

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) return null;

        return { id: user.id, name: user.username, email: user.email };
      },
    }),
  ],

  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.username as string;
      }
      return session;
    },
  },

  pages: { signIn: "/login" },
});
