// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import logger from "@/app/utils/logger";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Replace with your actual authentication logic
        if (credentials?.email && credentials?.password) {
          logger.info(
            { email: credentials.email },
            "Credentials login attempt",
          );
          // Return user object with required fields
          return {
            id: "1",
            email: credentials.email,
            name: "Test User",
          };
        }
        logger.warn("Invalid credentials attempt");
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/",
    error: "/error",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      // On first sign in, add user data to token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      // Ensure session.user exists before assigning
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
