import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "aicos-dashboard",
    configured: {
      supabase: Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
      redis: Boolean(process.env.UPSTASH_REDIS_REST_URL),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
      r2: Boolean(process.env.R2_BUCKET),
    },
    time: new Date().toISOString(),
  });
}
