// app/api/update-consent/route.ts (for Next.js App Router; adjust path if using Pages Router)

import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body (cookie consent data)
    const { cookieConsent } = await req.json()
    if (!cookieConsent) {
      return NextResponse.json({ error: "Missing consent data" }, { status: 400 })
    }

    // Instantiate clerkClient
    const client = await clerkClient()

    // Fetch current user to merge metadata
    const user = await client.users.getUser(userId)

    // Update public metadata
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        cookieConsent: {
          analytics: cookieConsent.analytics,
          essential: cookieConsent.essential,
          marketing: cookieConsent.marketing,
          timestamp: cookieConsent.timestamp,
          version: cookieConsent.version,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating metadata:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
