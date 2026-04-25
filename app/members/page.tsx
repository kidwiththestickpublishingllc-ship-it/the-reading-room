"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  membership_tier: "free" | "gold" | "founding";
  ink_balance: number;
  avatar_url: string | null;
};

type ForumPost = {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  post_type: "discussion" | "story_recommendation";
  story_title: string | null;
  story_author: string | null;
  story_rating: number | null;
  image_url: string | null;
  likes: number;
  created_at: string;
};

type AuthView = "dashboard" | "login" | "signup";
type ActiveTab = "forum" | "stories" | "profile" | "redroom";

export default function MembersRoomV2() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("forum");
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [postType, setPostType] = useState<"discussion" | "story_recommendation">("discussion");
  const [storyTitle, setStoryTitle] = useState("");
  const [storyAuthor, setStoryAuthor] = useState("");
  const [storyRating, setStoryRating] = useState(5);
  const [postImage, setPostImage] = useState("");
  const [posting, setPosting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { checkSession(); }, []);
  useEffect(() => { if (view === "dashboard") loadPosts(); }, [view]);

  async function checkSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      await loadProfile(session.user.id, session.user.email ?? "");
    } catch { setLoading(false); }
  }

  async function loadProfile(userId: string, userEmail: string) {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (error || !data) {
        await supabase.from("profiles").insert([{ id: userId, email: userEmail, membership_tier: "free", ink_balance: 250 }]);
        setProfile({ id: userId, email: userEmail, full_name: null, membership_tier: "free", ink_balance: 250, avatar_url: null });
      } else {
        setProfile({ id: data.id, email: data.email ?? userEmail, full_name: data.full_name ?? null, membership_tier: data.membership_tier ?? "free", ink_balance: data.ink_balance ?? 250, avatar_url: data.avatar_url ?? null });
      }
      setView("dashboard");
    } catch { setLoading(false); }
    finally { setLoading(false); }
  }

  async function loadPosts() {
    setPostsLoading(true);
    try {
      const { data } = await supabase.from("forum_posts").select("*").order("created_at", { ascending: false }).limit(50);
      if (data) setPosts(data as ForumPost[]);
    } catch { } finally { setPostsLoading(false); }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(""); setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setAuthError(error.message); return; }
      if (data.session) await loadProfile(data.session.user.id, data.session.user.email ?? "");
    } catch { setAuthError("Something went wrong. Please try again."); }
    finally { setAuthLoading(false); }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(""); setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
      if (error) { setAuthError(error.message); return; }
      if (data.user) await loadProfile(data.user.id, data.user.email ?? "");
    } catch { setAuthError("Something went wrong. Please try again."); }
    finally { setAuthLoading(false); }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setProfile(null); setView("login");
    setEmail(""); setPassword(""); setFullName("");
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !e.target.files[0] || !profile) return;
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5MB"); return; }
    setAvatarUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", profile.id);
      setProfile({ ...profile, avatar_url: publicUrl });
    } catch (err) { alert("Upload failed. Please try again."); }
    finally { setAvatarUploading(false); }
  }

  async function handleSubmitPost(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !newPost.trim()) return;
    setPosting(true);
    try {
      const postData: any = {
        author_id: profile.id,
        author_name: profile.full_name ?? profile.email.split("@")[0],
        author_avatar: profile.avatar_url,
        content: newPost.trim(),
        post_type: postType,
        likes: 0,
      };
      if (postType === "story_recommendation") {
        postData.story_title = storyTitle;
        postData.story_author = storyAuthor;
        postData.story_rating = storyRating;
      }
      if (postImage.trim()) postData.image_url = postImage.trim();
      const { error } = await supabase.from("forum_posts").insert([postData]);
      if (error) throw error;
      setNewPost(""); setStoryTitle(""); setStoryAuthor(""); setPostImage(""); setStoryRating(5);
      await loadPosts();
    } catch { alert("Failed to post. Please try again."); }
    finally { setPosting(false); }
  }

  async function handleLike(postId: string, currentLikes: number) {
    await supabase.from("forum_posts").update({ likes: currentLikes + 1 }).eq("id", postId);
    setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
  }

  function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  }

  function getTierBadge(tier: string) {
    if (tier === "founding") return { label: "Founding Member", color: "#C9A84C", bg: "rgba(201,168,76,0.15)", border: "#C9A84C" };
    if (tier === "gold") return { label: "Gold Member", color: "#FFD700", bg: "rgba(255,215,0,0.1)", border: "#FFD700" };
    return { label: "Free Reader", color: "#6495ED", bg: "rgba(100,149,237,0.1)", border: "#6495ED" };
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  function renderStars(rating: number) {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  }

  const discussionPosts = posts.filter(p => p.post_type === "discussion");
  const storyPosts = posts.filter(p => p.post_type === "story_recommendation");

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a14" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "32px", marginBottom: "16px" }}>🕯️</div>
        <p style={{ color: "#C9A84C", fontFamily: "'Cormorant Garamond', serif", fontSize: "18px" }}>Entering the Members Room...</p>
      </div>
    </div>
  );

  if (view === "login" || view === "signup") return (
    <div style={{ minHeight: "100vh", background: "#0a0a14", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "440px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>🕯️</div>
          <h1 style={{ color: "#C9A84C", fontFamily: "'Cormorant Garamond', serif", fontSize: "32px", fontWeight: "600", margin: "0 0 8px" }}>The Members Room</h1>
          <p style={{ color: "#888", fontSize: "14px", margin: 0 }}>The Tiniest Library — Members Only</p>
        </div>
        <div style={{ background: "#111122", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "16px", padding: "40px" }}>
          <div style={{ display: "flex", marginBottom: "28px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "4px" }}>
            <button onClick={() => { setView("login"); setAuthError(""); }} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "500", background: view === "login" ? "rgba(201,168,76,0.2)" : "transparent", color: view === "login" ? "#C9A84C" : "#666" }}>Sign In</button>
            <button onClick={() => { setView("signup"); setAuthError(""); }} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "500", background: view === "signup" ? "rgba(201,168,76,0.2)" : "transparent", color: view === "signup" ? "#C9A84C" : "#666" }}>Join Free</button>
          </div>
          <form onSubmit={view === "login" ? handleLogin : handleSignUp}>
            {view === "signup" && (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", color: "#aaa", fontSize: "13px", marginBottom: "6px" }}>Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              </div>
            )}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", color: "#aaa", fontSize: "13px", marginBottom: "6px" }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", color: "#aaa", fontSize: "13px", marginBottom: "6px" }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
            </div>
            {authError && <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px" }}><p style={{ color: "#f87171", fontSize: "13px", margin: 0 }}>{authError}</p></div>}
            <button type="submit" disabled={authLoading} style={{ width: "100%", padding: "14px", background: authLoading ? "rgba(201,168,76,0.4)" : "#C9A84C", color: "#1a1a2e", borderRadius: "8px", border: "none", fontSize: "15px", fontWeight: "700", cursor: authLoading ? "not-allowed" : "pointer" }}>
              {authLoading ? "Please wait..." : view === "login" ? "Enter the Room" : "Join The Library"}
            </button>
          </form>
          {view === "signup" && (
            <div style={{ marginTop: "24px", padding: "16px", background: "rgba(201,168,76,0.05)", borderRadius: "8px", border: "1px solid rgba(201,168,76,0.1)" }}>
              <p style={{ color: "#C9A84C", fontSize: "12px", fontWeight: "600", margin: "0 0 8px" }}>FREE MEMBERSHIP INCLUDES</p>
              <p style={{ color: "#888", fontSize: "12px", margin: "0 0 4px" }}>🪙 250 Ink to start reading</p>
              <p style={{ color: "#888", fontSize: "12px", margin: "0 0 4px" }}>📚 Access to The Reading Room</p>
              <p style={{ color: "#888", fontSize: "12px", margin: 0 }}>🪶 Support writers you love</p>
            </div>
          )}
        </div>
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <a href="/" style={{ color: "#555", fontSize: "13px", textDecoration: "none" }}>← Back to The Tiniest Library</a>
        </div>
      </div>
    </div>
  );

  if (view === "dashboard" && profile) {
    const badge = getTierBadge(profile.membership_tier);
    const displayName = profile.full_name ?? profile.email.split("@")[0];

    return (
      <div style={{ minHeight: "100vh", background: "#0a0a14", color: "#fff" }}>
        <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: "none" }} />

        {/* ── HEADER ── */}
        <div style={{ background: "#0d0d1a", borderBottom: "1px solid rgba(201,168,76,0.15)", padding: "16px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {/* AVATAR */}
              <div style={{ position: "relative", cursor: "pointer" }} onClick={() => avatarInputRef.current?.click()}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${badge.border}` }} />
                ) : (
                  <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: badge.bg, border: `2px solid ${badge.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: badge.color, fontSize: "20px", fontWeight: "700" }}>{getInitials(displayName)}</span>
                  </div>
                )}
                <div style={{ position: "absolute", bottom: 0, right: 0, width: "20px", height: "20px", background: "#C9A84C", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>
                  {avatarUploading ? "..." : "✎"}
                </div>
              </div>
              <div>
                <p style={{ color: "#666", fontSize: "11px", margin: "0 0 2px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Welcome back</p>
                <h1 style={{ color: "#f0ece2", fontFamily: "'Cormorant Garamond', serif", fontSize: "24px", fontWeight: "600", margin: "0 0 6px" }}>{displayName} 🕯️</h1>
                <div style={{ display: "inline-flex", padding: "3px 12px", borderRadius: "99px", background: badge.bg, border: `1px solid ${badge.border}` }}>
                  <span style={{ color: badge.color, fontSize: "11px", fontWeight: "600" }}>{badge.label}</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ padding: "10px 20px", background: "rgba(201,168,76,0.1)", borderRadius: "12px", border: "1px solid rgba(201,168,76,0.2)", textAlign: "center" }}>
                <p style={{ color: "#C9A84C", fontSize: "10px", fontWeight: "600", margin: "0 0 2px", letterSpacing: "0.08em" }}>INK BALANCE</p>
                <p style={{ color: "#fff", fontSize: "20px", fontWeight: "700", margin: 0 }}>🪙 {profile.ink_balance}</p>
              </div>
              <button onClick={handleLogout} style={{ padding: "8px 16px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#666", fontSize: "12px", cursor: "pointer" }}>Sign Out</button>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ background: "#0d0d1a", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "0 32px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", gap: "0" }}>
            {(["forum", "stories", "profile", "redroom"] as ActiveTab[]).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "12px 14px", background: "transparent", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: "600", color: activeTab === tab ? "#C9A84C" : "#555", borderBottom: activeTab === tab ? "2px solid #C9A84C" : "2px solid transparent", textTransform: "uppercase", letterSpacing: "0.06em", transition: "all 0.2s", whiteSpace: "nowrap" }}>
                {tab === "forum" ? "💬 Discussions" : tab === "stories" ? "📚 Story Picks" : tab === "redroom" ? "🖤 Red Room" : "👤 My Profile"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px" }}>

          {/* ── PLATFORM CARDS ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginBottom: "32px" }}>
            <a href="/reading-room" style={{ textDecoration: "none" }}>
              <div style={{ background: "#111122", border: "1px solid rgba(100,149,237,0.2)", borderRadius: "12px", padding: "20px", cursor: "pointer" }}>
                <span style={{ fontSize: "24px" }}>📚</span>
                <h3 style={{ color: "#6495ED", fontSize: "15px", fontWeight: "600", margin: "8px 0 4px" }}>The Reading Room</h3>
                <p style={{ color: "#555", fontSize: "12px", margin: 0 }}>Browse stories →</p>
              </div>
            </a>
            <a href={profile.membership_tier === "free" ? "https://redroom.the-tiniest-library.com" : "https://redroom.the-tiniest-library.com"} style={{ textDecoration: "none" }}>
              <div style={{ background: "#111122", border: `1px solid ${profile.membership_tier === "free" ? "rgba(255,255,255,0.05)" : "rgba(139,0,0,0.3)"}`, borderRadius: "12px", padding: "20px", opacity: 1 }}>
                <span style={{ fontSize: "24px" }}>🖤</span>
                <h3 style={{ color: "#8b0000", fontSize: "15px", fontWeight: "600", margin: "8px 0 4px" }}>The Red Room</h3>
                <p style={{ color: "#555", fontSize: "12px", margin: 0 }}>{profile.membership_tier === "free" ? "Upgrade to unlock →" : "Enter now →"}</p>
              </div>
            </a>
            <a href="https://write.the-tiniest-library.com" style={{ textDecoration: "none" }}>
              <div style={{ background: "#111122", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "12px", padding: "20px" }}>
                <span style={{ fontSize: "24px" }}>🪶</span>
                <h3 style={{ color: "#C9A84C", fontSize: "15px", fontWeight: "600", margin: "8px 0 4px" }}>The Writer's Room</h3>
                <p style={{ color: "#555", fontSize: "12px", margin: 0 }}>Apply to write →</p>
              </div>
            </a>
          </div>

          {/* ── FORUM TAB ── */}
          {activeTab === "forum" && (
            <div>
              <div style={{ background: "#111122", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "16px", padding: "24px", marginBottom: "24px" }}>
                <h2 style={{ color: "#C9A84C", fontSize: "16px", fontWeight: "600", margin: "0 0 16px" }}>💬 Start a Discussion</h2>
                <form onSubmit={handleSubmitPost}>
                  <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Share your thoughts with the TTL community..." rows={3} style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: "14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                    <button type="submit" disabled={posting || !newPost.trim()} style={{ padding: "10px 24px", background: posting || !newPost.trim() ? "rgba(201,168,76,0.3)" : "#C9A84C", color: "#1a1a2e", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: "700", cursor: posting || !newPost.trim() ? "not-allowed" : "pointer" }}>
                      {posting ? "Posting..." : "Post Discussion"}
                    </button>
                  </div>
                </form>
              </div>

              {postsLoading ? (
                <p style={{ color: "#555", textAlign: "center", padding: "40px" }}>Loading discussions...</p>
              ) : discussionPosts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", background: "#111122", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: "32px", marginBottom: "12px" }}>💬</div>
                  <p style={{ color: "#555", fontSize: "14px" }}>No discussions yet. Be the first to start one!</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {discussionPosts.map(post => (
                    <div key={post.id} style={{ background: "#111122", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        {post.author_avatar ? (
                          <img src={post.author_avatar} alt="" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(100,149,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ color: "#6495ED", fontSize: "13px", fontWeight: "700" }}>{getInitials(post.author_name)}</span>
                          </div>
                        )}
                        <div>
                          <p style={{ color: "#f0ece2", fontSize: "13px", fontWeight: "600", margin: 0 }}>{post.author_name}</p>
                          <p style={{ color: "#555", fontSize: "11px", margin: 0 }}>{timeAgo(post.created_at)}</p>
                        </div>
                      </div>
                      <p style={{ color: "#ccc", fontSize: "14px", lineHeight: "1.7", margin: "0 0 12px" }}>{post.content}</p>
                      {post.image_url && <img src={post.image_url} alt="" style={{ width: "100%", borderRadius: "8px", marginBottom: "12px", maxHeight: "300px", objectFit: "cover" }} />}
                      <button onClick={() => handleLike(post.id, post.likes)} style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "99px", padding: "4px 14px", color: "#C9A84C", fontSize: "12px", cursor: "pointer" }}>
                        ♥ {post.likes}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STORY PICKS TAB ── */}
          {activeTab === "stories" && (
            <div>
              <div style={{ background: "#111122", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "16px", padding: "24px", marginBottom: "24px" }}>
                <h2 style={{ color: "#C9A84C", fontSize: "16px", fontWeight: "600", margin: "0 0 16px" }}>📚 Recommend a Story</h2>
                <form onSubmit={handleSubmitPost}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                    <div>
                      <label style={{ display: "block", color: "#aaa", fontSize: "12px", marginBottom: "6px" }}>Story Title</label>
                      <input type="text" value={storyTitle} onChange={e => { setStoryTitle(e.target.value); setPostType("story_recommendation"); }} placeholder="Title of the story" style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", color: "#aaa", fontSize: "12px", marginBottom: "6px" }}>Author Name</label>
                      <input type="text" value={storyAuthor} onChange={e => setStoryAuthor(e.target.value)} placeholder="Written by" style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", color: "#aaa", fontSize: "12px", marginBottom: "6px" }}>Your Rating</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {[1,2,3,4,5].map(star => (
                        <button key={star} type="button" onClick={() => setStoryRating(star)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "24px", color: star <= storyRating ? "#C9A84C" : "#333" }}>★</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", color: "#aaa", fontSize: "12px", marginBottom: "6px" }}>Why do you love it?</label>
                    <textarea value={newPost} onChange={e => { setNewPost(e.target.value); setPostType("story_recommendation"); }} placeholder="Tell the community why they should read this..." rows={3} style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: "14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
                  </div>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", color: "#aaa", fontSize: "12px", marginBottom: "6px" }}>Image URL (optional)</label>
                    <input type="text" value={postImage} onChange={e => setPostImage(e.target.value)} placeholder="https://..." style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <button type="submit" disabled={posting || !newPost.trim() || !storyTitle.trim()} style={{ padding: "10px 24px", background: posting || !newPost.trim() || !storyTitle.trim() ? "rgba(201,168,76,0.3)" : "#C9A84C", color: "#1a1a2e", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                    {posting ? "Posting..." : "Share Recommendation"}
                  </button>
                </form>
              </div>

              {storyPosts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", background: "#111122", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: "32px", marginBottom: "12px" }}>📚</div>
                  <p style={{ color: "#555", fontSize: "14px" }}>No story picks yet. Share your favorite!</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                  {storyPosts.map(post => (
                    <div key={post.id} style={{ background: "#111122", border: "1px solid rgba(201,168,76,0.1)", borderRadius: "12px", padding: "20px" }}>
                      {post.image_url && <img src={post.image_url} alt="" style={{ width: "100%", borderRadius: "8px", marginBottom: "16px", height: "160px", objectFit: "cover" }} />}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <h3 style={{ color: "#f0ece2", fontSize: "16px", fontWeight: "600", margin: 0 }}>{post.story_title}</h3>
                        <span style={{ color: "#C9A84C", fontSize: "14px" }}>{renderStars(post.story_rating ?? 0)}</span>
                      </div>
                      <p style={{ color: "#888", fontSize: "12px", margin: "0 0 12px" }}>by {post.story_author}</p>
                      <p style={{ color: "#aaa", fontSize: "13px", lineHeight: "1.6", margin: "0 0 16px" }}>{post.content}</p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {post.author_avatar ? (
                            <img src={post.author_avatar} alt="" style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(100,149,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <span style={{ color: "#6495ED", fontSize: "10px", fontWeight: "700" }}>{getInitials(post.author_name)}</span>
                            </div>
                          )}
                          <span style={{ color: "#555", fontSize: "11px" }}>{post.author_name} · {timeAgo(post.created_at)}</span>
                        </div>
                        <button onClick={() => handleLike(post.id, post.likes)} style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "99px", padding: "3px 10px", color: "#C9A84C", fontSize: "11px", cursor: "pointer" }}>
                          ♥ {post.likes}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PROFILE TAB ── */}
          {activeTab === "profile" && (
            <div style={{ maxWidth: "600px" }}>
              <div style={{ background: "#111122", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "16px", padding: "32px" }}>
                <h2 style={{ color: "#C9A84C", fontSize: "18px", fontWeight: "600", margin: "0 0 24px" }}>👤 My Profile</h2>
                <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "32px", padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>
                  <div style={{ position: "relative", cursor: "pointer" }} onClick={() => avatarInputRef.current?.click()}>
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="avatar" style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: `3px solid ${badge.border}` }} />
                    ) : (
                      <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: badge.bg, border: `3px solid ${badge.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: badge.color, fontSize: "28px", fontWeight: "700" }}>{getInitials(displayName)}</span>
                      </div>
                    )}
                    <div style={{ position: "absolute", bottom: 0, right: 0, width: "24px", height: "24px", background: "#C9A84C", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
                      {avatarUploading ? "..." : "✎"}
                    </div>
                  </div>
                  <div>
                    <p style={{ color: "#f0ece2", fontSize: "18px", fontWeight: "600", margin: "0 0 4px" }}>{displayName}</p>
                    <p style={{ color: "#666", fontSize: "13px", margin: "0 0 8px" }}>{profile.email}</p>
                    <div style={{ display: "inline-flex", padding: "3px 12px", borderRadius: "99px", background: badge.bg, border: `1px solid ${badge.border}` }}>
                      <span style={{ color: badge.color, fontSize: "11px", fontWeight: "600" }}>{badge.label}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => avatarInputRef.current?.click()} style={{ width: "100%", padding: "12px", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "8px", color: "#C9A84C", fontSize: "13px", fontWeight: "600", cursor: "pointer", marginBottom: "12px" }}>
                  {avatarUploading ? "Uploading..." : "📷 Upload Profile Picture"}
                </button>
                <div style={{ padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ color: "#666", fontSize: "13px" }}>Membership</span>
                    <span style={{ color: badge.color, fontSize: "13px", fontWeight: "600" }}>{badge.label}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ color: "#666", fontSize: "13px" }}>Ink Balance</span>
                    <span style={{ color: "#C9A84C", fontSize: "13px", fontWeight: "600" }}>🪙 {profile.ink_balance}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#666", fontSize: "13px" }}>Posts</span>
                    <span style={{ color: "#fff", fontSize: "13px" }}>{posts.filter(p => p.author_id === profile.id).length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* ── RED ROOM TAB ── */}
          {activeTab === "redroom" && (
            <div>
              <div style={{ background: "linear-gradient(135deg, #1a0505, #0d0202)", border: "1px solid rgba(200,68,68,0.3)", borderRadius: "16px", padding: "24px", marginBottom: "24px" }}>
                <h2 style={{ color: "#c84444", fontSize: "16px", fontWeight: "600", margin: "0 0 8px" }}>🖤 The Red Room Community</h2>
                <p style={{ color: "#888", fontSize: "13px", margin: "0 0 16px", lineHeight: "1.6" }}>Adult discussions, dark romance picks, and explicit story recommendations. 18+ only.</p>
                <form onSubmit={handleSubmitPost}>
                  <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Share your thoughts with the Red Room community..." rows={3} style={{ width: "100%", padding: "12px 16px", background: "rgba(200,68,68,0.05)", border: "1px solid rgba(200,68,68,0.2)", borderRadius: "8px", color: "#fff", fontSize: "14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", flexWrap: "wrap", gap: 8 }}>
                    <a href="https://redroom.the-tiniest-library.com" target="_blank" rel="noopener noreferrer" style={{ color: "#c84444", fontSize: "12px", textDecoration: "none", letterSpacing: "0.06em" }}>Browse The Red Room →</a>
                    <button type="submit" disabled={posting || !newPost.trim()} style={{ padding: "10px 24px", background: posting || !newPost.trim() ? "rgba(200,68,68,0.3)" : "#c84444", color: "#fff", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: "700", cursor: posting || !newPost.trim() ? "not-allowed" : "pointer" }}>
                      {posting ? "Posting..." : "Post to Red Room"}
                    </button>
                  </div>
                </form>
              </div>
              {postsLoading ? (
                <p style={{ color: "#555", textAlign: "center", padding: "40px" }}>Loading...</p>
              ) : posts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", background: "#111122", borderRadius: "16px", border: "1px solid rgba(200,68,68,0.15)" }}>
                  <div style={{ fontSize: "32px", marginBottom: "12px" }}>🖤</div>
                  <p style={{ color: "#555", fontSize: "14px" }}>No Red Room discussions yet. Be the first.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {posts.map(post => (
                    <div key={post.id} style={{ background: "linear-gradient(135deg, #0d0202, #111122)", border: "1px solid rgba(200,68,68,0.15)", borderRadius: "12px", padding: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        {post.author_avatar ? (
                          <img src={post.author_avatar} alt="" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(200,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ color: "#c84444", fontSize: "13px", fontWeight: "700" }}>{getInitials(post.author_name)}</span>
                          </div>
                        )}
                        <div>
                          <p style={{ color: "#f0ece2", fontSize: "13px", fontWeight: "600", margin: 0 }}>{post.author_name}</p>
                          <p style={{ color: "#555", fontSize: "11px", margin: 0 }}>{timeAgo(post.created_at)}</p>
                        </div>
                      </div>
                      <p style={{ color: "#ccc", fontSize: "14px", lineHeight: "1.7", margin: "0 0 12px" }}>{post.content}</p>
                      <button onClick={() => handleLike(post.id, post.likes)} style={{ background: "rgba(200,68,68,0.08)", border: "1px solid rgba(200,68,68,0.2)", borderRadius: "99px", padding: "4px 14px", color: "#c84444", fontSize: "12px", cursor: "pointer" }}>
                        ♥ {post.likes}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* ── UPGRADE PANEL ── */}
          {profile.membership_tier === "free" && (
            <div id="upgrade" style={{ marginTop: "32px", background: "#111122", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "16px", padding: "40px" }}>
              <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>✒️</div>
                <h2 style={{ color: "#C9A84C", fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: "600", margin: "0 0 12px" }}>Ink Monthly</h2>
                <p style={{ color: "#888", fontSize: "15px", margin: "0 auto", lineHeight: "1.7", maxWidth: "500px" }}>Reading is always free. Ink Monthly lets you unlock stories without watching ads — and directly supports the writers you love.</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "24px" }}>
                  <p style={{ color: "#6495ED", fontSize: "11px", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase" as const, margin: "0 0 8px" }}>Reader</p>
                  <p style={{ color: "#fff", fontSize: "28px", fontWeight: "700", margin: "0 0 4px" }}>Free</p>
                  <p style={{ color: "#555", fontSize: "11px", margin: "0 0 16px" }}>Always free</p>
                  {["Full Reading Room access", "Earn Ink by watching ads", "Tip your favorite writers", "Red Room access (18+ verified)"].map((perk, i) => (
                    <p key={i} style={{ color: "#666", fontSize: "12px", margin: "0 0 4px" }}>✦ {perk}</p>
                  ))}
                  <button style={{ width: "100%", padding: "10px", marginTop: "16px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#888", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Current Plan</button>
                </div>
                <div style={{ background: "rgba(100,149,237,0.05)", border: "1px solid rgba(100,149,237,0.2)", borderRadius: "12px", padding: "24px" }}>
                  <p style={{ color: "#6495ED", fontSize: "11px", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase" as const, margin: "0 0 8px" }}>Ink Drop</p>
                  <p style={{ color: "#fff", fontSize: "28px", fontWeight: "700", margin: "0 0 4px" }}>$3<span style={{ fontSize: "14px", color: "#555" }}>/mo</span></p>
                  <p style={{ color: "#555", fontSize: "11px", margin: "0 0 16px" }}>✒️ 400 Ink / month</p>
                  {["Everything in Reader", "400 Ink every month", "Unlock up to 16 stories/mo", "No ads needed to earn Ink"].map((perk, i) => (
                    <p key={i} style={{ color: "#666", fontSize: "12px", margin: "0 0 4px" }}>✦ {perk}</p>
                  ))}
                  <button style={{ width: "100%", padding: "10px", marginTop: "16px", background: "#6495ED", color: "#fff", borderRadius: "8px", border: "none", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Start Ink Drop</button>
                </div>
                <div style={{ background: "rgba(201,168,76,0.06)", border: "2px solid rgba(201,168,76,0.4)", borderRadius: "12px", padding: "24px", position: "relative" }}>
                  <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "#C9A84C", color: "#000", fontSize: "10px", fontWeight: "700", padding: "3px 12px", borderRadius: "99px", whiteSpace: "nowrap" as const }}>MOST POPULAR</div>
                  <p style={{ color: "#C9A84C", fontSize: "11px", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase" as const, margin: "0 0 8px" }}>Ink Flow</p>
                  <p style={{ color: "#fff", fontSize: "28px", fontWeight: "700", margin: "0 0 4px" }}>$5<span style={{ fontSize: "14px", color: "#555" }}>/mo</span></p>
                  <p style={{ color: "#555", fontSize: "11px", margin: "0 0 16px" }}>✒️ 1,000 Ink / month</p>
                  {["Everything in Reader", "1,000 Ink every month", "Unlock up to 40 stories/mo", "No ads needed to earn Ink", "Founding Reader badge"].map((perk, i) => (
                    <p key={i} style={{ color: "#666", fontSize: "12px", margin: "0 0 4px" }}>✦ {perk}</p>
                  ))}
                  <button style={{ width: "100%", padding: "10px", marginTop: "16px", background: "#C9A84C", color: "#000", borderRadius: "8px", border: "none", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Start Ink Flow</button>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "24px" }}>
                  <p style={{ color: "#E2C97E", fontSize: "11px", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase" as const, margin: "0 0 8px" }}>Ink Vault</p>
                  <p style={{ color: "#fff", fontSize: "28px", fontWeight: "700", margin: "0 0 4px" }}>$9<span style={{ fontSize: "14px", color: "#555" }}>/mo</span></p>
                  <p style={{ color: "#555", fontSize: "11px", margin: "0 0 16px" }}>✒️ 2,500 Ink / month</p>
                  {["Everything in Reader", "2,500 Ink every month", "Unlock up to 100 stories/mo", "No ads needed to earn Ink", "Vault Member badge", "Exclusive Vault-only stories"].map((perk, i) => (
                    <p key={i} style={{ color: "#666", fontSize: "12px", margin: "0 0 4px" }}>✦ {perk}</p>
                  ))}
                  <button style={{ width: "100%", padding: "10px", marginTop: "16px", background: "linear-gradient(135deg, #C9A84C, #8a6510)", color: "#000", borderRadius: "8px", border: "none", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Start Ink Vault</button>
                </div>
              </div>
              <p style={{ textAlign: "center", color: "#444", fontSize: "11px", marginTop: "24px", lineHeight: "1.7" }}>100% of tips go directly to the writer. Always. 🪶 · Cancel anytime. No contracts.</p>
            </div>
          )}

        </div>
      </div>
    );
  }

  return null;
}
