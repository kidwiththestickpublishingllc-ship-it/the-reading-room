import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// =========================
// POST /api/publish-story
// Called by Airtable automation when a story is marked "Published"
// Secured with AIRTABLE_WEBHOOK_SECRET
// =========================

// Use service role key so we can write to Supabase bypassing RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// Helper — turn a title into a URL slug
// e.g. "The Wolves of Veldt" → "the-wolves-of-veldt"
// =========================
function toSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// =========================
// Helper — map Airtable badge value to our badge type
// =========================
function normalizeBadge(badge: string | undefined): "Explicit" | "Mature" | "Locked" | "Serial" {
  if (!badge) return "Serial";
  const b = badge.toLowerCase();
  if (b === "explicit") return "Explicit";
  if (b === "mature")   return "Mature";
  if (b === "locked")   return "Locked";
  return "Serial";
}

// =========================
// POST handler
// =========================
export async function POST(req: NextRequest) {

  // ── 1. Verify secret ─────────────────────────────────────────────────────
  const authHeader = req.headers.get("x-webhook-secret");
  if (authHeader !== process.env.AIRTABLE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // ── 2. Parse body ─────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // ── 3. Validate required fields ───────────────────────────────────────────
  const title       = body.title       as string | undefined;
  const author_name = body.author_name as string | undefined;
  const description = body.description as string | undefined;
  const cover_url   = body.cover_url   as string | undefined;
  const badge       = body.badge       as string | undefined;
  const author_id   = body.author_id   as string | undefined;

  if (!title || !author_name) {
    return NextResponse.json(
      { error: "Missing required fields: title, author_name" },
      { status: 400 }
    );
  }

  // ── 4. Generate slug ──────────────────────────────────────────────────────
  const slug = toSlug(title);

  // ── 5. Check for duplicate slug ───────────────────────────────────────────
  const { data: existing } = await supabase
    .from("stories")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: `A story with slug "${slug}" already exists.` },
      { status: 409 }
    );
  }

  // ── 6. Insert into Supabase ───────────────────────────────────────────────
  const { data, error } = await supabase
    .from("stories")
    .insert({
      title,
      slug,
      author_name,
      description:  description  ?? null,
      cover_url:    cover_url    ?? null,
      badge:        normalizeBadge(badge),
      is_published: true,
      author_id:    author_id    ?? null,
      created_at:   new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("[publish-story] Supabase insert error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // ── 7. Return success ─────────────────────────────────────────────────────
  return NextResponse.json(
    {
      success: true,
      message: `"${title}" published successfully.`,
      story: {
        id:    data.id,
        slug:  data.slug,
        title: data.title,
      },
    },
    { status: 201 }
  );
}

// ── Block all other methods ───────────────────────────────────────────────────
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

