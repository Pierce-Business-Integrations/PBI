import { NextRequest, NextResponse } from "next/server";
import { applyDropboxEvent } from "@/lib/portal/signing";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const json = data.get("json");
    if (typeof json !== "string") throw new Error("Missing callback JSON");
    await applyDropboxEvent(JSON.parse(json));
    return new NextResponse("Hello API Event Received", {
      headers: { "Content-Type": "text/plain" },
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid or unprocessed Dropbox Sign event" },
      { status: 400 },
    );
  }
}
