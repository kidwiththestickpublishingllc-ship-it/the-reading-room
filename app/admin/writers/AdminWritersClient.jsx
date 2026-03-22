// reading-room/app/admin/writers/AdminWritersClient.jsx
// Client component — handles approve/reject actions

'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const GOLD = '#c9a84c'
const NAVY = '#1a2744'

export default function AdminWritersClient({ writers: initial }) {
  const [writers, setWriters] = useState(initial)
  const [loading, setLoading] = useState(null)

  async function setApproved(id, value) {
    setLoading(id)
    const { error } = await supabase
      .from('writers')
      .update({ is_approved: value })
      .eq('id', id)

    if (!error) {
      setWriters(prev =>
        prev.map(w => w.id === id ? { ...w, is_approved: value } : w)
      )
    }
    setLoading(null)
  }

  async function setFoundingAuthor(id, value) {
    setLoading(id + '-founding')
    const { error } = await supabase
      .from('writers')
      .update({ is_founding_author: value })
      .eq('id', id)

    if (!error) {
      setWriters(prev =>
        prev.map(w => w.id === id ? { ...w, is_founding_author: value } : w)
      )
    }
    setLoading(null)
  }

  const pending = writers.filter(w => !w.is_approved)
  const approved = writers.filter(w => w.is_approved)

  return (
    <div style={s.page}>
      <div style={s.container}>

        <div style={s.header}>
          <p style={s.eyebrow}>The Tiniest Library</p>
          <h1 style={s.title}>Writer Applications</h1>
          <p style={s.subtitle}>
            {pending.length} pending · {approved.length} approved
          </p>
        </div>

        {/* Pending */}
        {pending.length > 0 && (
          <section style={s.section}>
            <h2 style={s.sectionLabel}>Pending Review</h2>
            {pending.map(writer => (
              <WriterRow
                key={writer.id}
                writer={writer}
                loading={loading}
                onApprove={() => setApproved(writer.id, true)}
                onReject={() => setApproved(writer.id, false)}
                onToggleFounding={() => setFoundingAuthor(writer.id, !writer.is_founding_author)}
              />
            ))}
          </section>
        )}

        {pending.length === 0 && (
          <div style={s.emptyState}>
            <span style={s.emptyIcon}>✦</span>
            <p style={s.emptyText}>No pending applications</p>
          </div>
        )}

        {/* Approved */}
        {approved.length > 0 && (
          <section style={s.section}>
            <h2 style={s.sectionLabel}>Approved Authors</h2>
            {approved.map(writer => (
              <WriterRow
                key={writer.id}
                writer={writer}
                loading={loading}
                onApprove={() => setApproved(writer.id, true)}
                onReject={() => setApproved(writer.id, false)}
                onToggleFounding={() => setFoundingAuthor(writer.id, !writer.is_founding_author)}
              />
            ))}
          </section>
        )}

      </div>
    </div>
  )
}

function WriterRow({ writer, loading, onApprove, onReject, onToggleFounding }) {
  const isLoading = loading === writer.id
  const date = new Date(writer.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })

  return (
    <div style={s.row}>
      <div style={s.rowPhoto}>
        {writer.photo_url ? (
          <img src={writer.photo_url} alt={writer.name} style={s.photo} />
        ) : (
          <div style={s.photoPlaceholder}>
            {writer.name?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div style={s.rowInfo}>
        <div style={s.rowName}>
          {writer.name || 'Unnamed writer'}
          {writer.is_founding_author && (
            <span style={s.foundingBadge}>Founding</span>
          )}
          {writer.is_approved && (
            <span style={s.approvedBadge}>Approved</span>
          )}
        </div>
        <div style={s.rowMeta}>Applied {date}</div>
        {writer.bio && (
          <div style={s.rowBio}>{writer.bio.slice(0, 120)}{writer.bio.length > 120 ? '…' : ''}</div>
        )}
      </div>

      <div style={s.rowActions}>
        {!writer.is_approved ? (
          <button
            style={s.approveBtn}
            onClick={onApprove}
            disabled={isLoading}
          >
            {isLoading ? '…' : 'Approve'}
          </button>
        ) : (
          <button
            style={s.revokeBtn}
            onClick={onReject}
            disabled={isLoading}
          >
            {isLoading ? '…' : 'Revoke'}
          </button>
        )}
        <button
          style={writer.is_founding_author ? s.foundingActiveBtn : s.foundingBtn}
          onClick={onToggleFounding}
          disabled={loading === writer.id + '-founding'}
        >
          {writer.is_founding_author ? '★ Founding' : '☆ Founding'}
        </button>
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh',
    background: '#0d1b2e',
    fontFamily: "'Inter', system-ui, sans-serif",
    color: '#e8e4d9',
    padding: '0 24px 80px',
  },
  container: {
    maxWidth: '860px',
    margin: '0 auto',
  },
  header: {
    padding: '60px 0 40px',
    borderBottom: '1px solid rgba(212,175,55,0.2)',
    marginBottom: '40px',
  },
  eyebrow: {
    fontSize: '11px',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    color: GOLD,
    margin: '0 0 12px',
    fontWeight: '500',
  },
  title: {
    fontSize: '36px',
    fontWeight: '300',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    color: '#f0ece0',
    margin: '0 0 8px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'rgba(232,228,217,0.5)',
    margin: 0,
  },
  section: {
    marginBottom: '48px',
  },
  sectionLabel: {
    fontSize: '11px',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    color: GOLD,
    margin: '0 0 20px',
    fontWeight: '500',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px',
    border: '1px solid rgba(255,255,255,0.06)',
    marginBottom: '40px',
  },
  emptyIcon: {
    fontSize: '20px',
    color: GOLD,
    display: 'block',
    marginBottom: '12px',
  },
  emptyText: {
    fontSize: '14px',
    color: 'rgba(232,228,217,0.4)',
    margin: 0,
  },
  row: {
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
    padding: '20px 24px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    marginBottom: '12px',
  },
  rowPhoto: {
    flexShrink: 0,
  },
  photo: {
    width: '52px',
    height: '52px',
    objectFit: 'cover',
  },
  photoPlaceholder: {
    width: '52px',
    height: '52px',
    background: 'rgba(212,175,55,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    color: GOLD,
    fontFamily: "'Cormorant Garamond', serif",
  },
  rowInfo: {
    flex: 1,
    minWidth: 0,
  },
  rowName: {
    fontSize: '16px',
    color: '#f0ece0',
    fontWeight: '500',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  rowMeta: {
    fontSize: '12px',
    color: 'rgba(232,228,217,0.4)',
    marginBottom: '8px',
  },
  rowBio: {
    fontSize: '13px',
    color: 'rgba(232,228,217,0.55)',
    lineHeight: '1.5',
  },
  rowActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexShrink: 0,
  },
  approveBtn: {
    padding: '8px 20px',
    background: 'rgba(212,175,55,0.15)',
    border: '1px solid rgba(212,175,55,0.4)',
    color: GOLD,
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    fontFamily: "'Inter', sans-serif",
  },
  revokeBtn: {
    padding: '8px 20px',
    background: 'rgba(220,38,38,0.1)',
    border: '1px solid rgba(220,38,38,0.3)',
    color: '#f87171',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    fontFamily: "'Inter', sans-serif",
  },
  foundingBtn: {
    padding: '8px 20px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(232,228,217,0.4)',
    fontSize: '12px',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    fontFamily: "'Inter', sans-serif",
  },
  foundingActiveBtn: {
    padding: '8px 20px',
    background: 'rgba(212,175,55,0.1)',
    border: '1px solid rgba(212,175,55,0.3)',
    color: GOLD,
    fontSize: '12px',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    fontFamily: "'Inter', sans-serif",
  },
  approvedBadge: {
    fontSize: '10px',
    padding: '2px 8px',
    background: 'rgba(34,197,94,0.1)',
    border: '1px solid rgba(34,197,94,0.3)',
    color: '#86efac',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  foundingBadge: {
    fontSize: '10px',
    padding: '2px 8px',
    background: 'rgba(212,175,55,0.1)',
    border: '1px solid rgba(212,175,55,0.3)',
    color: GOLD,
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
}
