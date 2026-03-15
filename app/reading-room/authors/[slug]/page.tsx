"use client";

import { useState } from "react";

export default function AuthorProfile({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params?.slug || "a-rivera";
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

  const handleProfileImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setProfilePreview(URL.createObjectURL(file));
  };

  const handleBannerImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setBannerPreview(URL.createObjectURL(file));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Syne:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .ap-root {
          min-height: 100vh;
          background: #0c0c0e;
          font-family: 'Syne', sans-serif;
          color: #e8e4da;
          position: relative;
          overflow-x: hidden;
        }

        /* Subtle grain overlay */
        .ap-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
          opacity: 0.4;
        }

        /* Banner */
        .ap-banner {
          position: relative;
          width: 100%;
          height: 280px;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%);
          overflow: hidden;
          cursor: pointer;
        }

        .ap-banner img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ap-banner-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 40%, #0c0c0e 100%);
        }

        .ap-banner-upload {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s;
          background: rgba(0,0,0,0.5);
          cursor: pointer;
        }
        .ap-banner:hover .ap-banner-upload { opacity: 1; }

        .ap-upload-hint {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #e8e4da;
          border: 1px solid rgba(232,228,218,0.4);
          padding: 10px 20px;
          backdrop-filter: blur(4px);
        }

        /* Content container */
        .ap-content {
          position: relative;
          z-index: 1;
          max-width: 780px;
          margin: 0 auto;
          padding: 0 32px 80px;
        }

        /* Profile header area */
        .ap-header {
          display: flex;
          align-items: flex-end;
          gap: 28px;
          margin-top: -64px;
          margin-bottom: 48px;
        }

        .ap-avatar-wrap {
          position: relative;
          flex-shrink: 0;
          cursor: pointer;
        }

        .ap-avatar {
          width: 120px;
          height: 120px;
          border-radius: 2px;
          background: #1e1e26;
          border: 3px solid #0c0c0e;
          object-fit: cover;
          display: block;
        }

        .ap-avatar-placeholder {
          width: 120px;
          height: 120px;
          border-radius: 2px;
          background: linear-gradient(135deg, #1e1e26, #2a2a38);
          border: 3px solid #0c0c0e;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cormorant Garamond', serif;
          font-size: 44px;
          font-weight: 300;
          color: #5a5a7a;
          text-transform: uppercase;
        }

        .ap-avatar-upload {
          position: absolute;
          inset: 3px;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
          border-radius: 1px;
        }
        .ap-avatar-wrap:hover .ap-avatar-upload { opacity: 1; }

        .ap-avatar-icon {
          color: #e8e4da;
          font-size: 22px;
        }

        .ap-header-info {
          padding-bottom: 8px;
        }

        .ap-badge {
          display: inline-block;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #c9a84c;
          border: 1px solid rgba(201,168,76,0.35);
          padding: 3px 10px;
          margin-bottom: 10px;
        }

        .ap-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 42px;
          font-weight: 300;
          line-height: 1;
          letter-spacing: 0.02em;
          text-transform: capitalize;
          color: #f0ece2;
        }

        /* Divider */
        .ap-divider {
          width: 100%;
          height: 1px;
          background: linear-gradient(to right, rgba(201,168,76,0.4), transparent);
          margin: 0 0 40px;
        }

        /* Section */
        .ap-section {
          margin-bottom: 36px;
        }

        .ap-label {
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #c9a84c;
          margin-bottom: 10px;
          display: block;
        }

        .ap-input, .ap-textarea {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(232,228,218,0.1);
          border-radius: 2px;
          color: #e8e4da;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          padding: 12px 16px;
          transition: border-color 0.2s, background 0.2s;
          outline: none;
          resize: none;
        }

        .ap-input::placeholder, .ap-textarea::placeholder {
          color: rgba(232,228,218,0.25);
        }

        .ap-input:focus, .ap-textarea:focus {
          border-color: rgba(201,168,76,0.5);
          background: rgba(255,255,255,0.06);
        }

        /* Links grid */
        .ap-links-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
        }

        .ap-link-wrap {
          position: relative;
        }

        .ap-link-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 14px;
          color: rgba(232,228,218,0.3);
          pointer-events: none;
        }

        .ap-link-input {
          padding-left: 38px !important;
        }

        /* Prize section */
        .ap-prize-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 12px;
        }

        /* Save button */
        .ap-save-btn {
          width: 100%;
          padding: 16px;
          background: transparent;
          border: 1px solid #c9a84c;
          color: #c9a84c;
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.25s, color 0.25s;
          margin-top: 12px;
          border-radius: 2px;
          position: relative;
          overflow: hidden;
        }

        .ap-save-btn:hover {
          background: #c9a84c;
          color: #0c0c0e;
        }

        .ap-save-btn.saved {
          background: #c9a84c;
          color: #0c0c0e;
        }

        /* Subtle decorative line left */
        .ap-section-group {
          position: relative;
          padding-left: 20px;
          border-left: 1px solid rgba(201,168,76,0.15);
        }

        @media (max-width: 600px) {
          .ap-banner { height: 180px; }
          .ap-header { flex-direction: column; align-items: flex-start; gap: 16px; margin-top: -48px; }
          .ap-name { font-size: 30px; }
          .ap-links-grid { grid-template-columns: 1fr; }
          .ap-prize-grid { grid-template-columns: 1fr; }
          .ap-content { padding: 0 20px 60px; }
        }
      `}</style>

      <div className="ap-root">
        {/* Banner */}
        <div className="ap-banner">
          {bannerPreview ? (
            <img src={bannerPreview} alt="Profile banner" />
          ) : null}
          <div className="ap-banner-overlay" />
          <label className="ap-banner-upload" htmlFor="banner-upload">
            <span className="ap-upload-hint">Change Banner</span>
          </label>
          <input
            id="banner-upload"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleBannerImg}
          />
        </div>

        <div className="ap-content">
          {/* Header */}
          <div className="ap-header">
            {/* Avatar */}
            <div className="ap-avatar-wrap">
              <label htmlFor="avatar-upload" style={{ cursor: "pointer" }}>
                {profilePreview ? (
                  <img className="ap-avatar" src={profilePreview} alt="Author avatar" />
                ) : (
                  <div className="ap-avatar-placeholder">
                    {authorName.charAt(0)}
                  </div>
                )}
                <div className="ap-avatar-upload">
                  <span className="ap-avatar-icon">✎</span>
                </div>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleProfileImg}
              />
            </div>

            <div className="ap-header-info">
              <span className="ap-badge">Founding Author</span>
              <h1 className="ap-name">{authorName}</h1>
            </div>
          </div>

          <div className="ap-divider" />

          {/* Form sections */}
          <div className="ap-section-group">

            <div className="ap-section">
              <label className="ap-label">Author Bio</label>
              <textarea
                className="ap-textarea"
                rows={4}
                placeholder="Tell readers about yourself — your voice, your world, your craft..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div className="ap-section">
              <label className="ap-label">Achievements</label>
              <textarea
                className="ap-textarea"
                rows={3}
                placeholder="Awards, milestones, notable publications..."
                value={achievements}
                onChange={(e) => setAchievements(e.target.value)}
              />
            </div>

            <div className="ap-section">
              <label className="ap-label">Author Links</label>
              <div className="ap-links-grid">
                <div className="ap-link-wrap">
                  <span className="ap-link-icon">⊕</span>
                  <input
                    className="ap-input ap-link-input"
                    placeholder="Website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
                <div className="ap-link-wrap">
                  <span className="ap-link-icon">𝕏</span>
                  <input
                    className="ap-input ap-link-input"
                    placeholder="Twitter / X"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                  />
                </div>
                <div className="ap-link-wrap">
                  <span className="ap-link-icon">◎</span>
                  <input
                    className="ap-input ap-link-input"
                    placeholder="Instagram"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="ap-section">
              <label className="ap-label">Monthly Prize</label>
              <div className="ap-prize-grid">
                <input
                  className="ap-input"
                  placeholder="Prize title"
                  value={prizeTitle}
                  onChange={(e) => setPrizeTitle(e.target.value)}
                />
                <textarea
                  className="ap-textarea"
                  rows={1}
                  placeholder="Brief description of the prize..."
                  value={prizeDesc}
                  onChange={(e) => setPrizeDesc(e.target.value)}
                />
              </div>
            </div>

          </div>

          <button
            className={`ap-save-btn${saved ? " saved" : ""}`}
            onClick={handleSave}
          >
            {saved ? "✓  Profile Saved" : "Save Profile"}
          </button>
        </div>
      </div>
    </>
  );
}
