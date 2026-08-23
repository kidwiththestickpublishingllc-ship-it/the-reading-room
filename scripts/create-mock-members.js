/**
 * create-mock-members.js
 * ─────────────────────────────────────────────────────────────────
 * Creates 20 mock reader accounts for testing the communication
 * pipeline — Reader's Letters, AskTheWriter, Genre Lounge posts,
 * follow system, notifications.
 *
 * Run from the reading-room repo root:
 *   node scripts/create-mock-members.js
 *
 * Creates:
 *  - 10 TTLM-1 through TTLM-10 — Reading Room readers
 *  - 10 RRMM-1 through RRMM-10 — Red Room readers (age verified)
 * ─────────────────────────────────────────────────────────────────
 */

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const MOCK_MEMBERS = [
  // Reading Room readers
  { code: "TTLM", prefix: "ttlm", count: 10, age_verified: false, bios: [
    "Lifelong reader. Fantasy and sci-fi are my escape hatch.",
    "I read on my lunch break and after the kids are asleep.",
    "Looking for stories that stay with me long after the last page.",
    "Crime fiction devotee. The darker the better.",
    "Romance reader. I believe in slow burns and happy endings.",
    "Literary fiction is my first love. Bring the complexity.",
    "Horror enthusiast. The psychological kind keeps me up at night.",
    "I discovered serialized fiction and now I can't stop.",
    "Historical fiction reader. I love being transported to other eras.",
    "Contemporary fiction fan. Give me real life with a literary twist.",
  ]},
  // Red Room readers (age verified)
  { code: "RRMM", prefix: "rrmm", count: 10, age_verified: true, bios: [
    "Dark romance collector. The morally grey love interest is always my favorite.",
    "Erotica reader. I appreciate craft and intention in explicit fiction.",
    "Paranormal romance devotee. Fangs and feelings welcome.",
    "BDSM fiction reader. The negotiation is part of the story.",
    "Monster romance enthusiast. The creature deserves love too.",
    "Taboo fiction explorer. Fiction exists to go where life cannot.",
    "Omegaverse reader. I know the tropes and I want them done well.",
    "MM romance fan. Give me real emotional depth with the heat.",
    "Slow burn dark romance reader. The wait is the whole point.",
    "Gothic horror romantic. Old houses and complicated feelings.",
  ]},
];

const GREETINGS = [
  "Just finished your last chapter. Incredible.",
  "I've been reading since chapter one. Don't stop.",
  "Your writing is exactly what I've been looking for.",
  "I recommended your story to everyone in my book club.",
  "The way you write dialogue is something else entirely.",
];

async function main() {
  console.log("TTL Mock Member Creator");
  console.log("Creating 20 mock reader accounts...\n");
  let created = 0, skipped = 0, failed = 0;

  for (const group of MOCK_MEMBERS) {
    console.log(`\n${group.code} — ${group.age_verified ? "Red Room (age verified)" : "Reading Room"}`);

    for (let i = 1; i <= group.count; i++) {
      const slug = `${group.prefix}-${i}`;
      const name = `${group.code}-${i}`;
      const email = `${slug}@thetiniestlibrary.com`;
      const bio = group.bios[i - 1];
      const username = slug;

      // Check if already exists
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existing) {
        console.log(`  SKIP ${name}`);
        skipped++;
        continue;
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: `TTLMember${group.code}${i}!2026`,
        email_confirm: true,
        user_metadata: { full_name: name },
      });

      if (authError) {
        console.log(`  FAIL ${name} — ${authError.message}`);
        failed++;
        continue;
      }

      const userId = authData.user.id;

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          email,
          full_name: name,
          username,
          bio,
          membership_tier: "free",
          ink_balance: 500,
          is_age_verified: group.age_verified,
          accent_color: group.age_verified ? "#C84444" : "#C9A84C",
          room_theme: "dark",
        });

      if (profileError) {
        console.log(`  FAIL ${name} profile — ${profileError.message}`);
        failed++;
        continue;
      }

      // Add a forum post so discussions look active
      const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
      await supabase.from("forum_posts").insert({
        author_id: userId,
        author_name: name,
        content: greeting,
        post_type: "discussion",
        likes: Math.floor(Math.random() * 5),
      });

      console.log(`  OK ${name} (${email})`);
      created++;
      await new Promise(r => setTimeout(r, 150));
    }
  }

  console.log("\n─────────────────────────────────────────");
  console.log(`✅ Created:  ${created}`);
  console.log(`⏭️  Skipped:  ${skipped}`);
  console.log(`❌ Failed:   ${failed}`);
  console.log("\n🕯️  Mock members ready for communication pipeline testing.");
}

main().catch(console.error);