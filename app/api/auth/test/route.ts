import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/middleware"

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    return NextResponse.json({
      message: "Authentication successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company
      }
    })
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    const body = await req.json()
    
    return NextResponse.json({
      message: "Authenticated POST request",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company
      },
      data: body
    })
  })
}