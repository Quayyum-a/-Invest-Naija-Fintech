import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Investment from "@/models/Investment"
import { authenticateRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const investments = await Investment.find({ userId: user.userId }).sort({ createdAt: -1 })

    return NextResponse.json({ investments })
  } catch (error: any) {
    console.error("Get investments error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { title, description, category, amount, expectedReturn, duration, riskLevel } = await request.json()

    // Validate required fields
    if (!title || !description || !category || !amount || !expectedReturn || !duration || !riskLevel) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Create new investment
    const investment = await Investment.create({
      userId: user.userId,
      title,
      description,
      category,
      amount,
      expectedReturn,
      duration,
      riskLevel,
    })

    return NextResponse.json(
      {
        message: "Investment created successfully",
        investment,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Create investment error:", error)

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message)
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
