import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const configuredOrigins = process.env.PORTAL_AUTHORIZED_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const authorizedParties = configuredOrigins?.length
  ? configuredOrigins
  : process.env.VERCEL_ENV === "production"
    ? ["https://client.piercebusinessintegrations.com"]
    : process.env.VERCEL_ENV === "preview"
      ? ["https://beta.piercebusinessintegrations.com"]
      : undefined;
const withClerk = clerkMiddleware(
  authorizedParties ? { authorizedParties } : undefined,
);

export default process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
process.env.CLERK_SECRET_KEY
  ? withClerk
  : () => NextResponse.next();

export const config = {
  matcher: [
    "/portal/:path*",
    "/api/portal/:path*",
    "/account/:path*",
    "/sign-in/:path*",
    "/sign-up/:path*",
  ],
};
