// reading-room/components/AuthorProfileCard.jsx
// Styled to match The Reading Room's dark blue & gold aesthetic

import Image from 'next/image'

const SOCIAL_ICONS = {
  twitter_url:   { label: 'X / Twitter', icon: '𝕏' },
  instagram_url: { label: 'Instagram',   icon: '◫' },
  website_url:   { label: 'Website',     icon: '⬡' },
}

export default function AuthorProfileCard({ writer }) {
  const {
    name,
    bio,
    greeting,
    photo_url,
    twitter_url,
    instagram_url,
    website_url,
    published_works = [],
    is_founding_author = false,
  } = writer

  const socialLinks = { twitter_url, instagram_url, website_url }
  const hasSocial = Object.values(socialLinks).some(Boolean)

  return (
    <article style={styles.card}>

      {/* ── Hero header ── */}
      <header style={styles.hero}>
        <div style={styles.photoWrap}>
          {photo_url ? (
            <Image
              src={photo_url}
              alt={`${name}'s profile photo`}
              width={140}
              height={140}
              style={{ objectFit: 'cover', width: '140px', height: '140px' }}
            />
          ) : (
            <div style={styles.photoPlaceholder}>
              {name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div style={styles.heroMeta}>
          {is_founding_author && (
            <span style={styles.badge}>Founding Author</span>
          )}
          <h1 style={styles.name}>{name}</h1>
          {greeting && (
            <p style={styles.greeting}>"{greeting}"</p>
          )}
        </div>
      </header>

      <div style={styles.divider} />

      {/* ── Bio ── */}
      {bio && (
        <section style={styles.section}>
          <h2 style={styles.sectionLabel}>Author Bio</h2>
          <div style={styles.infoBox}>
            <p style={styles.bio}>{bio}</p>
          </div>
        </section>
      )}

      {/* ── Published works / Achievements ── */}
      {published_works.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionLabel}>Achievements</h2>
          <div style={styles.infoBox}>
            <ul style={styles.worksList}>
              {published_works.map((work, i) => (
                <li key={i} style={styles.workItem}>
                  <span style={styles.workBullet}>✦</span>
                  {work.link ? (
                    <a href={work.link} target="_blank" rel="noopener noreferrer" style={styles.workLink}>
                      {work.title}
                    </a>
                  ) : (
                    <span style={styles.workTitle}>{work.title}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Social links ── */}
      {hasSocial && (
        <section style={styles.section}>
          <h2 style={styles.sectionLabel}>Connect</h2>
          <ul style={styles.socialList}>
            {Object.entries(SOCIAL_ICONS).map(([key, { label, icon }]) =>
              socialLinks[key] ? (
                <li key={key} style={{ listStyle: 'none' }}>
                  <a
                    href={socialLinks[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.socialLink}
                  >
                    <span style={styles.socialIcon}>{icon}</span>
                    {label}
                  </a>
                </li>
              ) : null
            )}
          </ul>
        </section>
      )}

    </article>
  )
}

// ── Inline styles matching the dark blue / gold Reading Room aesthetic ──
const styles = {
  card: {
    maxWidth: '860px',
    margin: '0 auto',
    padding: '0 24px 80px',
    fontFamily: "'Cormorant Garamond', 'Georgia', serif",
    color: '#e8e4d9',
  },
  hero: {
    display: 'flex',
    alignItems: 'center',
    gap: '40px',
    padding: '60px 0 40px',
  },
  photoWrap: {
    flexShrink: 0,
    width: '140px',
    height: '140px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(212,175,55,0.3)',
    overflow: 'hidden',
  },
  photoPlaceholder: {
    width: '140px',
    height: '140px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.06)',
    fontSize: '52px',
    fontFamily: "'Cormorant Garamond', serif",
    color: '#d4af37',
    letterSpacing: '2px',
  },
  heroMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  badge: {
    display: 'inline-block',
    padding: '3px 12px',
    border: '1px solid rgba(212,175,55,0.5)',
    color: '#d4af37',
    fontSize: '10px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    fontFamily: "'Inter', sans-serif",
    fontWeight: '500',
    width: 'fit-content',
  },
  name: {
    fontSize: '52px',
    fontWeight: '300',
    color: '#f0ece0',
    margin: 0,
    lineHeight: 1.1,
    letterSpacing: '-0.5px',
  },
  greeting: {
    fontSize: '16px',
    color: 'rgba(232,228,217,0.6)',
    fontStyle: 'italic',
    margin: 0,
    lineHeight: 1.6,
  },
  divider: {
    height: '1px',
    background: 'linear-gradient(90deg, rgba(212,175,55,0.4) 0%, rgba(212,175,55,0.1) 100%)',
    marginBottom: '48px',
  },
  section: {
    marginBottom: '40px',
  },
  sectionLabel: {
    fontSize: '11px',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    color: '#d4af37',
    fontFamily: "'Inter', sans-serif",
    fontWeight: '500',
    marginBottom: '16px',
    margin: '0 0 16px 0',
  },
  infoBox: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '24px 28px',
  },
  bio: {
    fontSize: '17px',
    lineHeight: '1.85',
    color: 'rgba(232,228,217,0.75)',
    margin: 0,
  },
  worksList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  workItem: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
    fontSize: '16px',
    color: 'rgba(232,228,217,0.75)',
  },
  workBullet: {
    color: '#d4af37',
    fontSize: '10px',
    flexShrink: 0,
  },
  workLink: {
    color: '#d4af37',
    textDecoration: 'none',
    borderBottom: '1px solid rgba(212,175,55,0.3)',
    paddingBottom: '1px',
    transition: 'border-color 0.2s',
  },
  workTitle: {
    color: 'rgba(232,228,217,0.75)',
  },
  socialList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
  socialLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'rgba(232,228,217,0.6)',
    textDecoration: 'none',
    fontSize: '14px',
    fontFamily: "'Inter', sans-serif",
    letterSpacing: '0.5px',
    padding: '8px 16px',
    border: '1px solid rgba(255,255,255,0.1)',
    transition: 'border-color 0.2s, color 0.2s',
  },
  socialIcon: {
    fontSize: '14px',
    color: '#d4af37',
  },
}
