import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      company?: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    company?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    company?: string
  }
}