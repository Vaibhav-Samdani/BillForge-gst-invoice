import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { verifyPassword } from "./password"
import { findClientByEmail } from "../db/client"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const client = await findClientByEmail(credentials.email as string)
          if (!client) {
            return null
          }

          const isValidPassword = await verifyPassword(
            credentials.password as string,
            client.passwordHash
          )

          if (!isValidPassword) {
            return null
          }

          if (!client.isVerified) {
            throw new Error("Email not verified")
          }

          return {
            id: client.id,
            email: client.email,
            name: client.name,
            company: client.company || undefined
          }
        } catch (error) {
          console.error("Authentication error:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.company = user.company
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.company = token.company as string
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
})