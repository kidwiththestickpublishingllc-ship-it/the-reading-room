"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type GlossaryTerm = {
  id: string;
  term: string;
  definition: string;
};

type Character = {
  id: string;
  name: string;
  backstory: string;
  image_url?: string;
};

type Props = {
  bookId: string;
  chapterNumber: number;
};

export default function ChapterUnlocks({ bookId, chapterNumber }: Props) {
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"glossary" | "characters">("glossary");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUnlocks() {
      const { data: unlock } = await supabase
        .from("chapter_unlocks")
        .select("glossary_ids, character_ids")
        .eq("book_id", bookId)
        .eq("chapter_number", chapterNumber)
        .single();

      if (!unlock) { setLoading(false); return; }

      if (unlock.glossary_ids?.length) {
        const { data } = await supabase
          .from("glossary")
          .select("id, term, definition")
          .in("id", unlock.glossary_ids);
        setGlossary(data ?? []);
      }

      if (unlock.character_ids?.length) {
        const { data } = await supabase
          .from("characters")
          .select("id, name, backstory, image_url")
          .in("id", unlock.character_ids);
        setCharacters(data ?? []);
      }

      setLoading(false);
      setOpen(true);
    }

    fetchUnlocks();
  }, [bookId, chapterNumber]);

  if (loading || (!glossary.length && !characters.length)) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
      transform: open ? "translateY(0)" : "translateY(100%)",
      transition: "transform 0.4s ease",
      background: "#111", borderTop: "1px solid rgba(201,168,76,0.3)",
      maxHeight: "60vh", overflowY: "auto",
      fontFamily: "'Syne', sans-serif"
    }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 32px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "#C9A84C", marginBottom: 4 }}>
              Chapter Complete
            </p>
            <h3 style={{ fontSize: 20, color: "#f0ece2", fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}>
              Unlocked Content
            </h3>
          </div>
          <button onClick={() => setOpen(false)} style={{
            background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.4)", borderRadius: 6, padding: "6px 14px",
            cursor: "pointer", fontSize: 11
          }}>Close</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {glossary.length > 0 && (
            <button onClick={() => setActiveTab("glossary")} style={{
              fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
              padding: "6px 16px", borderRadius: 999, cursor: "pointer",
              background: activeTab === "glossary" ? "#C9A84C" : "transparent",
              color: activeTab === "glossary" ? "#000" : "rgba(255,255,255,0.4)",
              border: "1px solid rgba(201,168,76,0.4)", fontWeight: 700
            }}>Glossary ({glossary.length})</button>
          )}
          {characters.length > 0 && (
            <button onClick={() => setActiveTab("characters")} style={{
              fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
              padding: "6px 16px", borderRadius: 999, cursor: "pointer",
              background: activeTab === "characters" ? "#C9A84C" : "transparent",
              color: activeTab === "characters" ? "#000" : "rgba(255,255,255,0.4)",
              border: "1px solid rgba(201,168,76,0.4)", fontWeight: 700
            }}>Characters ({characters.length})</button>
          )}
        </div>

        {/* Glossary Tab */}
        {activeTab === "glossary" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {glossary.map(term => (
              <div key={term.id} style={{
                background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)",
                borderRadius: 8, padding: "14px 18px"
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#C9A84C", marginBottom: 6 }}>{term.term}</p>
                <p style={{ fontSize: 13, color: "rgba(240,236,226,0.7)", lineHeight: 1.7 }}>{term.definition}</p>
              </div>
            ))}
          </div>
        )}

        {/* Characters Tab */}
        {activeTab === "characters" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {characters.map(char => (
              <div key={char.id} style={{
                background: "rgba(100,149,237,0.06)", border: "1px solid rgba(100,149,237,0.15)",
                borderRadius: 8, padding: "14px 18px", display: "flex", gap: 16, alignItems: "flex-start"
              }}>
                {char.image_url && (
                  <img src={char.image_url} alt={char.name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                )}
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#84b0f5", marginBottom: 6 }}>{char.name}</p>
                  <p style={{ fontSize: 13, color: "rgba(240,236,226,0.7)", lineHeight: 1.7 }}>{char.backstory}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}