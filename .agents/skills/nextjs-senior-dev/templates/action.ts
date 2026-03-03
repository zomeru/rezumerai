// @ts-nocheck
"use server"

import { z } from "zod"
import { auth } from "@/lib/auth"
import { revalidateTag } from "next/cache"

// 1. Define schema
const ActionSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
})

// 2. Define return type
type ActionResult =
  | { success: true; id: string }
  | { success: false; error: string }

// 3. Rate limit helper (implement in @/lib/rate-limit)
async function rateLimit(key: string, opts: { limit: number; window: string }) {
  // Example using Upstash:
  // const { success } = await rateLimiter.limit(key)
  // if (!success) throw new Error("Rate limit exceeded")
}

// 4. Audit log helper (implement in @/lib/audit)
async function logAudit(data: {
  action: string
  userId: string
  resourceId?: string
}) {
  // Log to your audit system
  console.log("[AUDIT]", data)
}

export async function createItem(formData: FormData): Promise<ActionResult> {
  try {
    // STEP 1: Rate limit
    await rateLimit("createItem", { limit: 10, window: "1m" })

    // STEP 2: Authentication
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // STEP 3: Validation (sanitize errors)
    let validated
    try {
      validated = ActionSchema.parse({
        title: formData.get("title"),
        content: formData.get("content"),
      })
    } catch {
      return { success: false, error: "Invalid input" }
    }

    // STEP 4: Authorization (IDOR prevention)
    // For updates/deletes:
    // const existing = await db.items.findUnique({ where: { id } })
    // if (existing.authorId !== session.user.id) {
    //   return { success: false, error: "Forbidden" }
    // }

    // STEP 5: Mutation
    const item = await db.items.create({
      data: {
        ...validated,
        authorId: session.user.id,
      },
    })

    // STEP 6: Granular cache invalidation
    revalidateTag(`user-${session.user.id}-items`)

    // STEP 7: Audit log (async, don't block)
    logAudit({
      action: "createItem",
      userId: session.user.id,
      resourceId: item.id,
    }).catch(console.error)

    return { success: true, id: item.id }
  } catch (error) {
    console.error("[ACTION_ERROR]", error)
    return { success: false, error: "Something went wrong" }
  }
}

// Type-safe form usage
export async function updateItem(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  // Same 7-step pattern with ownership check in Step 4
  return { success: false, error: "Not implemented" }
}

export async function deleteItem(id: string): Promise<ActionResult> {
  // Same 7-step pattern with ownership check in Step 4
  return { success: false, error: "Not implemented" }
}