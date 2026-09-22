// One-time script: replaces the fake localStorage-based Ink balance and
// Tip button on the author profile page with the real thing — a signed-in
// reader's actual profiles.ink_balance, and a real call to the (now-fixed)
// tip_writer RPC.
//
// Run from the repo root: node scripts/fix-author-tip.js

const fs = require("fs");
const path = require("path");

function applyReplacements(filePath, replacements) {
  let raw = fs.readFileSync(filePath, "utf8");
  const hadCRLF = raw.includes("\r\n");
  let content = hadCRLF ? raw.replace(/\r\n/g, "\n") : raw;

  for (const { label, old, new: replacement } of replacements) {
    const count = content.split(old).length - 1;
    if (count !== 1) {
      console.error(`✘ FAILED: "${label}" — expected 1 match, found ${count}. Aborting before writing.`);
      return false;
    }
    content = content.replace(old, replacement);
    console.log(`✔ Applied: ${label}`);
  }

  if (hadCRLF) {
    content = content.replace(/\n/g, "\r\n");
  }
  fs.writeFileSync(filePath, content, "utf8");
  return true;
}

const filePath = path.join(__dirname, "..", "app", "reading-room", "authors", "[slug]", "AuthorProfileClient.tsx");

const ok = applyReplacements(filePath, [
  {
    label: "Add userId field to AuthorData type",
    old: `  storiesCount: number;
  inkJar: number;
  stories: Story[];`,
    new: `  storiesCount: number;
  inkJar: number;
  userId?: string | null;
  stories: Story[];`,
  },
  {
    label: "Replace fake localStorage balance load with real auth + real balance",
    old: `  const [jar, setJar] = useState(0);
  const [ink, setInk] = useState(DEFAULT_INK);
  const [tipMsg, setTipMsg] = useState("");

  useEffect(() => {
    setInk(Number(window.localStorage.getItem("ttl_ink") ?? DEFAULT_INK));
    const raw = window.localStorage.getItem("ttl_author_jar");
    const parsed = raw ? JSON.parse(raw) : {};
    setJar(parsed[slug] ?? 0);
  }, [slug]);`,
    new: `  const [jar, setJar] = useState(0);
  const [ink, setInk] = useState(DEFAULT_INK);
  const [tipMsg, setTipMsg] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadReader() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      setUserId(userData.user.id);
      const { data: profileData } = await supabase
        .from("profiles")
        .select("ink_balance")
        .eq("id", userData.user.id)
        .single();
      setInk(profileData?.ink_balance ?? 0);
    }
    loadReader();
  }, []);`,
  },
  {
    label: "Store the writer's real auth id on the author object",
    old: `          storiesCount: storiesData?.length ?? 0,
          inkJar: jar,
          is_founding_author: writerData.is_founding_author,`,
    new: `          storiesCount: storiesData?.length ?? 0,
          inkJar: jar,
          userId: writerData.user_id ?? null,
          is_founding_author: writerData.is_founding_author,`,
  },
  {
    label: "Replace fake tipAuthor with a real tip_writer call",
    old: `  const tipAuthor = (amount: number) => {
    if (ink < amount) { setTipMsg("Not enough Ink."); setTimeout(() => setTipMsg(""), 2000); return; }
    const newInk = ink - amount;
    const newJar = jar + amount;
    setInk(newInk);
    setJar(newJar);
    window.localStorage.setItem("ttl_ink", String(newInk));
    const raw = window.localStorage.getItem("ttl_author_jar");
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[slug] = newJar;
    window.localStorage.setItem("ttl_author_jar", JSON.stringify(parsed));
    setTipMsg(\`✓ Tipped \${amount} Ink to \${author?.name}!\`);
    setTimeout(() => setTipMsg(""), 3000);
  };`,
    new: `  const tipAuthor = async (amount: number) => {
    if (!userId) { setTipMsg("Sign in to tip this author."); setTimeout(() => setTipMsg(""), 2000); return; }
    if (!author?.userId) { setTipMsg("This author can't be tipped yet."); setTimeout(() => setTipMsg(""), 2000); return; }
    if (ink < amount) { setTipMsg("Not enough Ink."); setTimeout(() => setTipMsg(""), 2000); return; }

    const { data, error } = await supabase.rpc("tip_writer", {
      p_tipper_id: userId,
      p_writer_id: author.userId,
      p_writer_name: author.name,
      p_amount: amount,
      p_story_slug: null,
    });

    if (error || !data?.success) {
      setTipMsg(data?.error === "insufficient_ink" ? "Not enough Ink." : "Tip failed. Try again.");
      setTimeout(() => setTipMsg(""), 2000);
      return;
    }

    setInk(data.new_balance);
    setTipMsg(\`✓ Tipped \${amount} Ink to \${author?.name}!\`);
    setTimeout(() => setTipMsg(""), 3000);
  };`,
  },
]);

if (!ok) {
  console.error("\nEdit failed. No changes were written.");
  process.exit(1);
}

console.log("\nAll edits applied successfully.");