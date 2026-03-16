"use client";

import { useState } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Syne:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ttl-bg:        #6495ED;
    --ttl-panel:     rgba(10, 25, 60, 0.72);
    --ttl-panel-alt: rgba(10, 25, 60, 0.55);
    --ttl-border:    rgba(255,255,255,0.18);
    --ttl-border-soft: rgba(255,255,255,0.10);
    --ttl-gold:      #c9a84c;
    --ttl-gold-dim:  rgba(201,168,76,0.45);
    --ttl-text:      #f0ece2;
    --ttl-text-dim:  rgba(240,236,226,0.55);
    --ttl-text-mute: rgba(240,236,226,0.30);
  }

  .ap-root {
    min-height: 100vh;
    font-family: 'Syne', sans-serif;
    color: var(--ttl-text);
    background: var(--ttl-bg);
    background-image:
      radial-gradient(900px circle at 10% 10%, rgba(255,255,255,0.18), transparent 60%),
      radial-gradient(700px circle at 85% 80%, rgba(0,0,0,0.15), transparent 55%),
      repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 10px);
    position: relative; overflow-x: hidden;
  }

  /* NAV */
  .ap-nav { position:sticky; top:0; z-index:40; background:rgba(10,25,60,0.88); backdrop-filter:blur(14px); border-bottom:1px solid var(--ttl-border-soft); }
  .ap-nav-inner { max-width:780px; margin:0 auto; padding:0 32px; height:58px; display:flex; align-items:center; justify-content:space-between; gap:20px; }
  .ap-nav-brand { font-family:'Cormorant Garamond',serif; font-size:20px; font-weight:400; color:var(--ttl-text); text-decoration:none; letter-spacing:0.03em; }
  .ap-nav-brand span { color:var(--ttl-gold); }
  .ap-nav-back { font-size:10px; letter-spacing:0.16em; text-transform:uppercase; color:var(--ttl-text-dim); text-decoration:none; border:1px solid var(--ttl-border-soft); padding:6px 14px; border-radius:2px; transition:all 0.2s; }
  .ap-nav-back:hover { color:var(--ttl-text); border-color:var(--ttl-border); background:rgba(255,255,255,0.07); }

  /* BANNER */
  .ap-banner { position:relative; width:100%; height:260px; overflow:hidden; cursor:pointer; background:linear-gradient(135deg, rgba(10,25,60,0.9) 0%, rgba(20,50,120,0.8) 100%); }
  .ap-banner img { width:100%; height:100%; object-fit:cover; }
  .ap-banner-overlay { position:absolute; inset:0; background:linear-gradient(to bottom, transparent 30%, var(--ttl-bg) 100%); }
  .ap-banner-upload { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity 0.3s; background:rgba(0,0,30,0.45); cursor:pointer; }
  .ap-banner:hover .ap-banner-upload { opacity:1; }
  .ap-upload-hint { font-family:'Syne',sans-serif; font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:var(--ttl-text); border:1px solid var(--ttl-border); padding:10px 22px; backdrop-filter:blur(4px); background:rgba(10,25,60,0.5); }

  /* CONTENT */
  .ap-content { position:relative; z-index:1; max-width:780px; margin:0 auto; padding:0 32px 80px; }

  /* HEADER */
  .ap-header { display:flex; align-items:flex-end; gap:28px; margin-top:-60px; margin-bottom:44px; }
  .ap-avatar-wrap { position:relative; flex-shrink:0; cursor:pointer; }
  .ap-avatar { width:120px; height:120px; border-radius:2px; background:rgba(10,25,60,0.8); border:3px solid var(--ttl-bg); object-fit:cover; display:block; }
  .ap-avatar-placeholder { width:120px; height:120px; border-radius:2px; background:rgba(10,25,60,0.8); border:3px solid var(--ttl-bg); display:flex; align-items:center; justify-content:center; font-family:'Cormorant Garamond',serif; font-size:48px; font-weight:300; color:var(--ttl-gold); text-transform:uppercase; }
  .ap-avatar-upload { position:absolute; inset:3px; background:rgba(0,0,30,0.55); display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity 0.2s; border-radius:1px; }
  .ap-avatar-wrap:hover .ap-avatar-upload { opacity:1; }
  .ap-avatar-icon { color:var(--ttl-text); font-size:22px; }
  .ap-header-info { padding-bottom:8px; }
  .ap-badge { display:inline-block; font-size:9px; letter-spacing:0.2em; text-transform:uppercase; color:var(--ttl-gold); border:1px solid var(--ttl-gold-dim); padding:3px 10px; margin-bottom:10px; background:rgba(201,168,76,0.1); }
  .ap-name { font-family:'Cormorant Garamond',serif; font-size:44px; font-weight:300; line-height:1; letter-spacing:0.02em; text-transform:capitalize; color:var(--ttl-text); }

  /* DIVIDER */
  .ap-divider { height:1px; background:linear-gradient(to right, var(--ttl-gold-dim), transparent); margin:0 0 36px; }

  /* FORM GROUP */
  .ap-section-group { padding-left:20px; border-left:2px solid rgba(201,168,76,0.2); }
  .ap-section { margin-bottom:32px; }
  .ap-label { font-size:10px; letter-spacing:0.22em; text-transform:uppercase; color:var(--ttl-gold); margin-bottom:10px; display:block; }

  /* INPUTS */
  .ap-input, .ap-textarea {
    width:100%;
    background:var(--ttl-panel-alt);
    border:1px solid var(--ttl-border-soft);
    border-radius:2px;
    color:var(--ttl-text);
    font-family:'Syne',sans-serif;
    font-size:14px;
    padding:12px 16px;
    transition:all 0.2s;
    outline:none;
    resize:none;
    backdrop-filter:blur(6px);
  }
  .ap-input::placeholder, .ap-textarea::placeholder { color:var(--ttl-text-mute); }
  .ap-input:focus, .ap-textarea:focus { border-color:var(--ttl-gold-dim); background:rgba(10,25,60,0.7); }

  /* LINKS GRID */
  .ap-links-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }
  .ap-link-wrap { position:relative; }
  .ap-link-icon { position:absolute; left:14px; top:50%; transform:translateY(-50%); font-size:14px; color:var(--ttl-text-mute); pointer-events:none; }
  .ap-link-input { padding-left:38px !important; }

  /* PRIZE GRID */
  .ap-prize-grid { display:grid; grid-template-columns:1fr 2fr; gap:10px; }

  /* SAVE BTN */
  .ap-save-btn {
    width:100%; padding:15px;
    background:transparent; border:1px solid var(--ttl-gold);
    color:var(--ttl-gold); font-family:'Syne',sans-serif;
    font-size:10px; letter-spacing:0.25em; text-transform:uppercase;
    cursor:pointer; transition:all 0.25s; margin-top:10px; border-radius:2px;
  }
  .ap-save-btn:hover, .ap-save-btn.saved { background:var(--ttl-gold); color:#0a1940; }

  /* RESPONSIVE */
  @media (max-width:600px) {
    .ap-banner { height:180px; }
    .ap-header { flex-direction:column; align-items:flex-start; gap:14px; margin-top:-44px; }
    .ap-name { font-size:32px; }
    .ap-links-grid { grid-template-columns:1fr; }
    .ap-prize-grid { grid-template-columns:1fr; }
    .ap-content { padding:0 20px 60px; }
    .ap-nav-inner { padding:0 20px; }
  }
`;

export default function AuthorProfile({ params }: { params: { slug: string } }) {
  const slug = params?.slug || "unknown-author";
  const authorName = slug.replaceAll("-", " ");

  const [bio, setBio] = useState("");
  const [achievements, setAchievements] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");
  const [prizeTitle, setPrizeTitle] = useState("");
  const [prizeDesc, setPrizeDesc] = useState("");
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <>
      <style>{STYLES}</style>
      <div className="ap-root">

        {/* NAV */}
        <nav className="ap-nav">
          <div className="ap-nav-inner">
            <a href="/reading-room" className="ap-nav-brand">The Tiniest <span>Library</span></a>
            <a href="/reading-room/authors" className="ap-nav-back">← Author Directory</a>
          </div>
        </nav>

        {/* BANNER */}
        <div className="ap-banner">
          {bannerPreview && <img src={bannerPreview} alt="Profile banner" />}
          <div className="ap-banner-overlay" />
          <label className="ap-banner-upload" htmlFor="banner-upload">
            <span className="ap-upload-hint">Change Banner</span>
          </label>
          <input id="banner-upload" type="file" accept="image/*" style={{ display:"none" }} onChange={e => { const f = e.target.files?.[0]; if (f) setBannerPreview(URL.createObjectURL(f)); }} />
        </div>

        <div className="ap-content">
          {/* HEADER */}
          <div className="ap-header">
            <div className="ap-avatar-wrap">
              <label htmlFor="avatar-upload" style={{ cursor:"pointer" }}>
                {profilePreview
                  ? <img className="ap-avatar" src={profilePreview} alt="Author avatar" />
                  : <div className="ap-avatar-placeholder">{authorName.charAt(0)}</div>}
                <div className="ap-avatar-upload"><span className="ap-avatar-icon">✎</span></div>
              </label>
              <input id="avatar-upload" type="file" accept="image/*" style={{ display:"none" }} onChange={e => { const f = e.target.files?.[0]; if (f) setProfilePreview(URL.createObjectURL(f)); }} />
            </div>
            <div className="ap-header-info">
              <span className="ap-badge">Founding Author</span>
              <h1 className="ap-name">{authorName}</h1>
            </div>
          </div>

          <div className="ap-divider" />

          {/* FORM */}
          <div className="ap-section-group">
            <div className="ap-section">
              <label className="ap-label">Author Bio</label>
              <textarea className="ap-textarea" rows={4} placeholder="Tell readers about yourself — your voice, your world, your craft…" value={bio} onChange={e => setBio(e.target.value)} />
            </div>

            <div className="ap-section">
              <label className="ap-label">Achievements</label>
              <textarea className="ap-textarea" rows={3} placeholder="Awards, milestones, notable publications…" value={achievements} onChange={e => setAchievements(e.target.value)} />
            </div>

            <div className="ap-section">
              <label className="ap-label">Author Links</label>
              <div className="ap-links-grid">
                <div className="ap-link-wrap">
                  <span className="ap-link-icon">⊕</span>
                  <input className="ap-input ap-link-input" placeholder="Website" value={website} onChange={e => setWebsite(e.target.value)} />
                </div>
                <div className="ap-link-wrap">
                  <span className="ap-link-icon">𝕏</span>
                  <input className="ap-input ap-link-input" placeholder="Twitter / X" value={twitter} onChange={e => setTwitter(e.target.value)} />
                </div>
                <div className="ap-link-wrap">
                  <span className="ap-link-icon">◎</span>
                  <input className="ap-input ap-link-input" placeholder="Instagram" value={instagram} onChange={e => setInstagram(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="ap-section">
              <label className="ap-label">Monthly Prize</label>
              <div className="ap-prize-grid">
                <input className="ap-input" placeholder="Prize title" value={prizeTitle} onChange={e => setPrizeTitle(e.target.value)} />
                <textarea className="ap-textarea" rows={1} placeholder="Brief description of the prize…" value={prizeDesc} onChange={e => setPrizeDesc(e.target.value)} />
              </div>
            </div>
          </div>

          <button className={`ap-save-btn${saved ? " saved" : ""}`} onClick={handleSave}>
            {saved ? "✓  Profile Saved" : "Save Profile"}
          </button>
        </div>
      </div>
    </>
  );
}
