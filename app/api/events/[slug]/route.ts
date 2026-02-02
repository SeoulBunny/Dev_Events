import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Event, { IEvent } from "@/database/event.model";

/**
 * Response type for successful event fetch
 */
interface SuccessResponse {
  message: string;
  event: IEvent;
}

/**
 * Response type for error cases
 */
interface ErrorResponse {
  message: string;
  error?: string;
}

/**
 * GET /api/events/[slug]
 * Fetches a single event by its slug
 *
 * @param request - Next.js request object (unused but required for route signature)
 * @param context - Route context containing dynamic route parameters
 * @returns JSON response with event data or error message
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    // Await params to extract slug (Next.js 15+ requirement)
    const { slug } = await context.params;

    // Validate slug parameter exists
    if (!slug) {
      return NextResponse.json(
        { message: "Slug parameter is required" },
        { status: 400 }
      );
    }

    // Validate slug format (alphanumeric, hyphens only, no leading/trailing hyphens)
    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugPattern.test(slug)) {
      return NextResponse.json(
        {
          message: "Invalid slug format. Must contain only lowercase letters, numbers, and hyphens.",
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Query event by slug
    const event = await Event.findOne({ slug }).lean<IEvent>();

    // Handle event not found
    if (!event) {
      return NextResponse.json(
        { message: `Event with slug "${slug}" not found` },
        { status: 404 }
      );
    }

    // Return successful response
    return NextResponse.json(
      { message: "Event fetched successfully", event },
      { status: 200 }
    );
  } catch (error) {
    // Log error for debugging (will appear in server logs)
    console.error("Error fetching event by slug:", error);

    // Handle database connection errors specifically
    if (error instanceof Error && error.message.includes("MONGODB_URI")) {
      return NextResponse.json(
        {
          message: "Database configuration error",
          error: "Unable to connect to database",
        },
        { status: 503 }
      );
    }

    // Generic error handler for unexpected issues
    return NextResponse.json(
      {
        message: "Failed to fetch event",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
