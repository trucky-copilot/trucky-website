import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    authorization: { params: { scope: "openid email profile" } },
  })],
  callbacks: {
    async signIn({ account, profile }) {
      return account?.provider === "google" && (profile as { email_verified?: boolean })?.email_verified === true;
    },
  },
};
