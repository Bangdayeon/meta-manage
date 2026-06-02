import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { password: { label: "비밀번호", type: "password" } },
      async authorize(credentials) {
        if (credentials?.password === process.env.APP_PASSWORD) {
          return { id: "owner", name: "나" };
        }
        return null;
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
});
