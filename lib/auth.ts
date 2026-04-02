import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  onCreateUser: async (user: { id: string; email: string }) => {
    // Set default role to USER; admins can be updated manually in DB
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'USER' },
    });
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});