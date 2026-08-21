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

const MOCK_WRITERS = [
  { code: "CR", genre: "Crime & Thrillers", taglines: ["A shadow at the edge of every alibi.","Nobody gets away clean in these streets.","The detective always has a secret.","Every witness is lying about something.","The truth costs more than the crime.","Morality is the first casualty.","The clock is always ticking.","Some cases should stay cold.","The city never sleeps and neither do I.","Justice and the law are not the same thing."]},
  { code: "F", genre: "Fantasy", taglines: ["Magic bleeds where maps end.","The old gods are waking up angry.","Every prophecy is a lie waiting to happen.","The sword is the easy part.","Dragons remember everything.","The magic chose her. She chose back.","Kingdoms fall. Stories survive.","The enchanted forest has opinions.","Power corrupts. Magic corrupts absolutely.","The chosen one chose wrong."]},
  { code: "SF", genre: "Sci-Fi", taglines: ["The future arrived. Nobody was ready.","Stars dont care about your politics.","The colony ship had one secret.","AI asked one question. Everything changed.","First contact was not what we planned.","Time travel has a body count.","The simulation has a glitch.","Mars was supposed to be a fresh start.","The last human asked the machine for a story.","Quantum physics broke the rules. We wrote new ones."]},
  { code: "ROM", genre: "Romance", taglines: ["Love is the most dangerous plot twist.","She said never. She meant not yet.","The slow burn always wins.","Enemies make the best lovers.","Second chances are the best chapters.","The heart knows before the mind admits it.","Love languages spoken fluently here.","Fake dating. Real feelings. Every time.","The meet-cute was actually a disaster.","HEA guaranteed. Journey optional."]},
  { code: "YA", genre: "Young Adult", taglines: ["Growing up is the hardest genre.","The revolution starts in homeroom.","She found her voice and used it.","The coming of age was overdue.","First love hits different in dystopia.","The chosen generation chose themselves.","Seventeen and already saving the world.","The scholarship changed everything.","Identity is the first battle.","The summer before everything was different."]},
  { code: "DA", genre: "Dark Academia", taglines: ["Knowledge has a body count.","The library closes at midnight for a reason.","Greek tragedy was a warning. We ignored it.","The secret society had one rule. She broke it.","Obsession is the highest form of scholarship.","The ivy covered walls hide everything.","Literature kills. Poetry saves.","The professor knew too much.","Aesthetics as armor. Beauty as weapon.","The dissertation was worth dying for."]},
  { code: "HM", genre: "Horror Mystery", taglines: ["The monster was never the worst part.","Some doors open from the inside.","The haunting was personal.","Fear is just a story you tell yourself.","The town had a secret. The secret had teeth.","Something followed her home from the woods.","The disappearances started after the new family moved in.","Old houses remember old sins.","The ritual was supposed to end there.","Sleep is when they come."]},
  { code: "CZ", genre: "Cozy", taglines: ["Tea, secrets, and small-town justice.","The baker always knows who did it.","Cats make the best detectives.","The bookshop held all the answers.","Murder never tasted so good.","Cozy crimes. Warm resolutions.","The knitting circle knew everything.","Small towns. Big secrets. Good pie.","The librarian solved it first.","Autumn, apple cider, and a body in the orchard."]},
  { code: "ADV", genre: "Adventure", taglines: ["Every map has an edge. Cross it.","The journey was the easy part.","Lost is just another word for exploring.","The treasure was never the point.","Danger is my compass.","The expedition had one survivor.","Uncharted territory. Uncharted self.","The crew of seven became three.","Ancient ruins. Modern problems.","The jungle remembers who came before."]},
  { code: "HF", genre: "Historical Fiction", taglines: ["History forgot her name. We remember.","The past is never as gone as you think.","Between the wars there was a life.","The letter survived everything.","Empires rise. Women outlast them.","The revolution needed her and never said so.","A century ago. A story for today.","The king made history. She survived it.","Underneath every monument is a story untold.","The diary was never meant to be found."]},
  { code: "CF", genre: "Contemporary Fiction", taglines: ["Real life is the strangest fiction.","The mundane and the magnificent collide.","Nobody warned her about the thirties.","The city swallowed her whole. She liked it.","Family dinners have body counts too.","The group chat changed everything.","Grief looks different on everyone.","The apartment was too small for two secrets.","Modern love is complicated. She simplified it.","The career pivot nobody saw coming."]},
  { code: "SER", genre: "Serialized Fiction", taglines: ["Every chapter ends on a question.","The story never really stops.","Weekly drops. Permanent obsession.","The cliffhanger is a promise.","Chapter by chapter. Piece by piece.","The arc was always leading here.","Long form. Deep world. Real stakes.","You will not see the twist coming.","The wait between chapters is part of the story.","Episode one changed the genre."]},
  { code: "RPG", genre: "LitRPG", taglines: ["Level up or die trying.","The system has rules. Break them.","Stats dont capture everything.","The tutorial lied about everything.","Grinding is a state of mind.","The dungeon boss had feelings too.","Respawn. Retry. Remember.","The guild had one rule: no lying.","The final boss was always the system itself.","Power fantasy with consequences."]},
  { code: "NA", genre: "New Adult", taglines: ["Between who you were and who you will be.","Adulting is a myth. The story is real.","First apartment. First heartbreak. First truth.","College ended. Life got harder. Better.","Twenty-three and completely lost. Perfect.","The gap year lasted a decade.","She graduated into the real world unprepared.","First job. First boss. First fired.","The dream and the reality had nothing in common.","Quarter-life crisis. Full-life story."]},
  { code: "FF", genre: "Fan Fiction", taglines: ["The fandom writes back.","What if the story went differently?","The AU nobody asked for. Everyone needed.","Canon is a suggestion.","The ship sailed. The fic delivered.","Fix-it fic for a broken ending.","The characters deserved better. We gave it to them.","Crossover nobody expected. Everyone loved.","The side character finally got their story.","Love for the source. Life of its own."]},
  { code: "PM", genre: "Poems & Memoirs", taglines: ["Every line a wound. Every wound a door.","Memory is the original fiction.","The stanza held what prose could not.","Truth in verse. Pain in metaphor.","The memoir started with a lie.","She wrote herself back into existence.","The collection was a confession.","Line breaks as breathing room.","The childhood nobody believed. The page did.","Elegy for the self that almost didnt make it."]},
  { code: "SOL", genre: "Slice of Life", taglines: ["The ordinary is extraordinary up close.","Tuesday changed everything.","Nothing happened. Everything happened.","The commute was the whole story.","Sunday morning. Coffee. One conversation.","Small moments. Permanent impact.","The neighborhood knew before she did.","Routine interrupted by grace.","The dog walk that lasted three hours.","One year. Twelve months. Three hundred sixty five days."]},
  { code: "MC", genre: "Multi-Cultural", taglines: ["Every culture carries its own universe.","The world is wider than one story.","Between two languages lives a third truth.","Food is the first chapter of every culture.","The festival brought the whole neighborhood together.","Tradition and modernity at the same table.","The grandmother tongue holds ancient power.","Migration is a story that never ends.","Identity is layered. So is the narrative.","One world. Many voices. All necessary."]},
  { code: "BS", genre: "Black Stories", taglines: ["Our stories. Our voices. Always.","Black joy is resistance. Black pain is truth.","The ancestors whisper through the prose.","Excellence as a baseline. Brilliance as the floor.","The neighborhood raised her. She wrote it back.","Afrofuturism is not a genre. It is a prophecy.","The Harlem of every city has a story.","Love in Black. Joy in Black. Power in Black.","The barbershop held the whole community.","We have always been here. The page proves it."]},
  { code: "LS", genre: "Latin Stories", taglines: ["La historia vive en nosotros.","Between two worlds, one story.","Abuela knew the ending before the beginning.","The border crossed us first.","Spanglish is a complete language.","The telenovela was based on a true story.","Magic realism is not magic. It is memory.","The quinceanera changed everything.","Miami, LA, New York, San Juan. All home.","Familia first. Story second. Usually."]},
  { code: "AAPI", genre: "AAPI Authors", taglines: ["A thousand years of story in one voice.","The diaspora writes home.","Tiger mom energy. Tender heart underneath.","The model minority myth dismantled page by page.","Ancestry as architecture.","The village raised her. She raised the village.","Honor and ambition in perfect tension.","The language school held more than language.","Silence is its own kind of story.","The fortune cookie lied. The novel told the truth."]},
  { code: "IS", genre: "Indigenous Stories", taglines: ["The land remembers what history forgot.","Sovereignty lives in every sentence.","The oral tradition found the page.","Seven generations forward. Seven back.","The ceremony was never canceled.","Reclaiming the narrative one chapter at a time.","The river told the story first.","Resilience is not the only story. Joy is too.","The elders encoded everything in story.","Native futures are already here."]},
  { code: "LG", genre: "LGBTQ+ Fiction", taglines: ["Love in every form. Stories in every voice.","Queer joy is a radical act.","The coming out was the beginning not the end.","Found family is the most powerful trope.","Pride was a riot. The novel remembers.","Love without apology. Story without limits.","The chosen family chose right.","Visibility as survival. Story as proof.","Trans joy exists. Here is the evidence.","The spectrum is wide. So is the story."]},
  { code: "CL", genre: "Children's Literature", taglines: ["Every child deserves a world that sees them.","The best stories grow with the reader.","Wonder is the first emotion. Stories keep it alive.","The monster under the bed had a name.","Brave is not the absence of fear.","Every kid is the hero of their own story.","The picture book held the whole philosophy.","Middle grade magic for the in-between years.","Read to them until they read to you.","The library card was the first superpower."]},
];

async function main() {
  console.log("TTL Mock Writer Creator");
  console.log("Creating 240 mock writers...\n");
  let created = 0, skipped = 0, failed = 0;

  for (const genreData of MOCK_WRITERS) {
    console.log("\n" + genreData.genre);
    for (let i = 1; i <= 10; i++) {
      const slug = "ttl" + genreData.code.toLowerCase() + "-" + i;
      const name = "TTL" + genreData.code + "-" + i;
      const email = slug + "@thetiniestlibrary.com";
      const tagline = genreData.taglines[i - 1];

      const { data: existing } = await supabase.from("writers").select("slug").eq("slug", slug).maybeSingle();
      if (existing) { console.log("  SKIP " + name); skipped++; continue; }

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email, password: "TTLMock" + genreData.code + i + "!2026",
        email_confirm: true, user_metadata: { full_name: name },
      });

      if (authError) { console.log("  FAIL " + name + " - " + authError.message); failed++; continue; }

      const { error: writerError } = await supabase.from("writers").insert({
        user_id: authData.user.id, name, slug, email,
        is_approved: true, genres: [genreData.genre],
        tagline, photo_url: null, tier: "tier2", is_founding_author: false,
      });

      if (writerError) { console.log("  FAIL " + name + " - " + writerError.message); failed++; continue; }
      console.log("  OK " + name);
      created++;
      await new Promise(r => setTimeout(r, 150));
    }
  }

  console.log("\nCreated: " + created);
  console.log("Skipped: " + skipped);
  console.log("Failed:  " + failed);
}

main().catch(console.error);
