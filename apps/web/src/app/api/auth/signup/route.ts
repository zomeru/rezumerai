import { prisma } from "@rezumerai/database";
import * as argon2 from "argon2";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Zod validation schema for user registration.
 * Enforces email format and password requirements.
 */
// biome-ignore lint/nursery/useExplicitType: Zod type inference required
const SignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * POST /api/auth/signup
 *
 * Creates a new user account with hashed password.
 * Validates input, checks for existing users, and securely stores credentials.
 *
 * @param request - Next.js request with JSON body { email, password }
 * @returns JSON response with success status or error message
 *
 * @example
 * ```ts
 * const response = await fetch('/api/auth/signup', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ email: 'user@example.com', password: 'secure123' })
 * });
 * ```
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = SignupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: "Email already registered" }, { status: 409 });
    }

    // Hash password with argon2
    const hashedPassword = await argon2.hash(validatedData.password);

    // Create new user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: "",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          email: user.email,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: error.issues[0]?.message || "Invalid input",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
