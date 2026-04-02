import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        (session.user as unknown as { role: string }).role = token.role as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isAuthenticated = !!auth?.user;
      const { pathname } = nextUrl;

      // Allow auth API routes
      if (pathname.startsWith("/api/auth")) {
        return true;
      }

      // Redirect unauthenticated users to login
      if (!isAuthenticated && (pathname.startsWith("/admin") || pathname.startsWith("/chat"))) {
        return false;
      }

      // Admin routes: only SUPER_ADMIN and KB_ADMIN
      if (pathname.startsWith("/admin") && isAuthenticated) {
        const role = (auth?.user as { role?: string })?.role;
        if (role !== "SUPER_ADMIN" && role !== "KB_ADMIN") {
          return Response.redirect(new URL("/chat", nextUrl.origin));
        }
      }

      return true;
    },
  },
};
