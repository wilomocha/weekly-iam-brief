import React, { useState, useEffect, useRef, useCallback } from 'react'

// ─── Design tokens ────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  :root {
    --bg: #0d1014;
    --panel: #161b22;
    --border: #262e3a;
    --ink: #e9eff6;
    --muted: #8593a5;
    --amber: #f6a821;
    --teal: #34d3bd;
    --red: #f8736b;
    --paper: #f4eede;
    --panel-fill: #fbf7ec;
    --paper-ink: #1c1a16;
    --font-display: 'Bricolage Grotesque', sans-serif;
    --font-mono: 'IBM Plex Mono', monospace;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg);
    color: var(--ink);
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.6;
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -10%, rgba(246,168,33,0.08) 0%, transparent 60%),
      repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(38,46,58,0.35) 39px, rgba(38,46,58,0.35) 40px),
      repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(38,46,58,0.35) 39px, rgba(38,46,58,0.35) 40px);
    min-height: 100vh;
  }

  a { color: var(--amber); text-decoration: none; }
  a:hover { text-decoration: underline; }

  .console-wrap { max-width: 900px; margin: 0 auto; padding: 32px 20px 80px; }

  /* Header */
  .hdr-kicker { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.18em; color: var(--muted); text-transform: uppercase; margin-bottom: 4px; }
  .hdr-title { font-family: var(--font-display); font-size: clamp(32px,6vw,52px); font-weight: 800; line-height: 1; margin-bottom: 6px; }
  .hdr-title span { color: var(--amber); }
  .hdr-sub { font-size: 11px; color: var(--muted); display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 0; }
  .spof-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(248,115,107,0.12); border: 1px solid rgba(248,115,107,0.35); border-radius: 20px; padding: 2px 10px; font-size: 11px; color: var(--red); font-weight: 500; }
  .spof-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--red); animation: pulse 2s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.75)} }

  /* Feed meta */
  .feed-meta { font-size: 11px; color: var(--muted); margin: 18px 0 4px; }

  /* Sections */
  .section-label { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); border-bottom: 1px solid var(--border); padding-bottom: 6px; margin-bottom: 14px; margin-top: 28px; }
  .section-label.action { color: var(--amber); border-color: rgba(246,168,33,0.35); }

  /* Cards */
  .card { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 14px 16px; margin-bottom: 10px; }
  .card.actionable { border-left: 3px solid var(--amber); }
  .card-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
  .chip { display: inline-block; font-size: 10px; font-weight: 500; border-radius: 4px; padding: 1px 7px; text-transform: uppercase; letter-spacing: 0.08em; }
  .chip-high { background: rgba(248,115,107,0.15); color: var(--red); }
  .chip-medium { background: rgba(246,168,33,0.15); color: var(--amber); }
  .chip-low { background: rgba(52,211,189,0.12); color: var(--teal); }
  .chip-cat { background: rgba(133,147,165,0.15); color: var(--muted); }
  .card-date { font-size: 10px; color: var(--muted); margin-left: auto; }
  .card-title { font-size: 14px; font-weight: 500; margin-bottom: 4px; line-height: 1.4; }
  .card-summary { font-size: 12px; color: var(--muted); margin-bottom: 6px; }
  .card-action { font-size: 12px; color: var(--amber); margin-bottom: 6px; }
  .card-source { font-size: 10px; color: var(--muted); }

  /* Shimmer skeleton */
  .shimmer { background: linear-gradient(90deg, var(--panel) 25%, #1e2530 50%, var(--panel) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 4px; }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .skel-line { height: 12px; margin-bottom: 8px; border-radius: 3px; }

  /* Error / empty */
  .error-card { background: rgba(248,115,107,0.08); border: 1px solid rgba(248,115,107,0.3); border-radius: 8px; padding: 16px; color: var(--red); margin-bottom: 10px; }
  .empty-card { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 24px; color: var(--muted); text-align: center; margin-bottom: 10px; font-size: 12px; }

  /* Comic section */
  .comic-section { margin-top: 36px; }
  .comic-header { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
  .comic-title-text { font-family: var(--font-display); font-size: 20px; font-weight: 700; color: var(--paper); }
  .comic-strip-label { font-size: 11px; color: var(--muted); }
  .comic-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
  .comic-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; background: var(--paper-ink); border: 2px solid var(--paper-ink); border-radius: 6px; overflow: hidden; }
  .comic-panel svg { display: block; width: 100%; height: auto; }

  .btn { background: var(--panel); border: 1px solid var(--border); border-radius: 6px; color: var(--ink); font-family: var(--font-mono); font-size: 12px; padding: 8px 16px; cursor: pointer; transition: border-color 0.15s, color 0.15s; white-space: nowrap; }
  .btn:hover { border-color: var(--amber); color: var(--amber); }
  .btn:disabled { opacity: 0.4; cursor: default; }
`

// ─── ISO week helpers ─────────────────────────────────────────────────────────
function getISOWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7)
}

function getWeekMonday(d) {
  const date = new Date(d)
  const day = date.getDay() || 7
  date.setDate(date.getDate() - day + 1)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const now = new Date()
const ISO_WEEK = getISOWeek(now)
const WEEK_MONDAY = getWeekMonday(now)

// ─── SVG Comic Panel Renderer ─────────────────────────────────────────────────
const W = 260, H = 180

function wrapText(text, maxChars) {
  const words = String(text).split(' ')
  const lines = []
  let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars) { lines.push(cur.trim()); cur = w }
    else cur = (cur + ' ' + w).trim()
  }
  if (cur) lines.push(cur)
  return lines
}

function mouthPath(cx, cy, mood) {
  if (mood === 'happy') return `M${cx-5},${cy} Q${cx},${cy+5} ${cx+5},${cy}`
  if (mood === 'worried') return `M${cx-5},${cy+3} Q${cx},${cy-2} ${cx+5},${cy+3}`
  return `M${cx-5},${cy} L${cx+5},${cy}`
}

function StickFigure({ x, pose, mood }) {
  const hx = x, hy = 60
  const armY = hy + 28
  let lax = hx - 18, lax2 = hx - 8, rax = hx + 18, rax2 = hx + 8
  let llx = hx - 10, lly = hy + 65, rlx = hx + 10, rly = hy + 65
  if (pose === 'panic') { lax = hx - 22; lax2 = hx - 12; rax = hx + 22; rax2 = hx + 12 }
  if (pose === 'shrug') { lax2 = hx - 20; rax2 = hx + 20 }
  if (pose === 'point-right') { rax2 = hx + 28; lax2 = hx - 8 }
  if (pose === 'point-left') { lax2 = hx - 28; rax2 = hx + 8 }
  return (
    <g>
      <circle cx={hx} cy={hy} r={12} fill="none" stroke="#1c1a16" strokeWidth="2" />
      <circle cx={hx - 4} cy={hy - 2} r={1.5} fill="#1c1a16" />
      <circle cx={hx + 4} cy={hy - 2} r={1.5} fill="#1c1a16" />
      <path d={mouthPath(hx, hy + 4, mood)} fill="none" stroke="#1c1a16" strokeWidth="1.5" strokeLinecap="round" />
      <line x1={hx} y1={hy + 12} x2={hx} y2={hy + 55} stroke="#1c1a16" strokeWidth="2" />
      <line x1={hx} y1={armY} x2={lax} y2={armY + 12} stroke="#1c1a16" strokeWidth="2" strokeLinecap="round" />
      <line x1={lax} y1={armY + 12} x2={lax2} y2={armY + 22} stroke="#1c1a16" strokeWidth="2" strokeLinecap="round" />
      <line x1={hx} y1={armY} x2={rax} y2={armY + 12} stroke="#1c1a16" strokeWidth="2" strokeLinecap="round" />
      <line x1={rax} y1={armY + 12} x2={rax2} y2={armY + 22} stroke="#1c1a16" strokeWidth="2" strokeLinecap="round" />
      <line x1={hx} y1={hy + 55} x2={llx} y2={lly} stroke="#1c1a16" strokeWidth="2" strokeLinecap="round" />
      <line x1={hx} y1={hy + 55} x2={rlx} y2={rly} stroke="#1c1a16" strokeWidth="2" strokeLinecap="round" />
    </g>
  )
}

function SpeechBubble({ text, tailX, bx, by, maxW = 110 }) {
  const lines = wrapText(text, 18)
  const bh = lines.length * 16 + 10
  const bw = Math.min(maxW, Math.max(60, ...lines.map(l => l.length * 6 + 14)))
  const tailY = by + bh
  const tailXAdj = Math.max(bx + 6, Math.min(bx + bw - 6, tailX))
  return (
    <g>
      <rect x={bx} y={by} width={bw} height={bh} rx={6} fill="#fffef9" stroke="#1c1a16" strokeWidth="1.2" />
      <polygon points={`${tailXAdj - 5},${tailY} ${tailXAdj + 5},${tailY} ${tailX},${tailY + 10}`} fill="#fffef9" stroke="#1c1a16" strokeWidth="1.2" strokeLinejoin="round" />
      {lines.map((l, i) => (
        <text key={i} x={bx + bw / 2} y={by + 14 + i * 16} textAnchor="middle" fontSize="10" fontFamily="'IBM Plex Mono', monospace" fill="#1c1a16">{l}</text>
      ))}
    </g>
  )
}

function ComicPanel({ panel, svgRef }) {
  const { cap, fig } = panel
  const capH = cap ? 20 : 0
  const figureXmap = { left: 55, center: 130, right: 205 }

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" style={{ background: '#fbf7ec' }}>
      <rect x={0} y={0} width={W} height={H} fill="#fbf7ec" />
      {fig.map((f, i) => {
        const fx = figureXmap[f.p] ?? 130
        const bw = 108
        let bx = f.p === 'right' ? Math.max(4, fx - bw - 2) : Math.min(W - bw - 4, fx + 4)
        if (f.p === 'center') bx = (W - bw) / 2
        return <SpeechBubble key={i} text={f.line} tailX={fx} bx={bx} by={4} maxW={bw} />
      })}
      {fig.map((f, i) => {
        const fx = figureXmap[f.p] ?? 130
        return <StickFigure key={i} x={fx} pose={f.pose || 'neutral'} mood={f.mood || 'neutral'} />
      })}
      {cap && (
        <>
          <rect x={0} y={H - capH} width={W} height={capH} fill="#e8e0cc" />
          <text x={W / 2} y={H - 6} textAnchor="middle" fontSize="10" fontFamily="'IBM Plex Mono', monospace" fill="#1c1a16" fontStyle="italic">{cap}</text>
        </>
      )}
    </svg>
  )
}

// ─── News Card ────────────────────────────────────────────────────────────────
function NewsCard({ item }) {
  const chipClass = item.severity === 'high' ? 'chip chip-high' : item.severity === 'medium' ? 'chip chip-medium' : 'chip chip-low'
  return (
    <div className={`card${item.actionable ? ' actionable' : ''}`}>
      <div className="card-top">
        <span className={chipClass}>{item.severity}</span>
        {item.category && <span className="chip chip-cat">{item.category}</span>}
        {item.date && <span className="card-date">{item.date}</span>}
      </div>
      <div className="card-title">
        {item.url ? <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a> : item.title}
      </div>
      {item.summary && <div className="card-summary">{item.summary}</div>}
      {item.actionable && item.action && <div className="card-action">→ Action: {item.action}</div>}
      {item.source && <div className="card-source">Source: {item.source}</div>}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card">
      <div className="shimmer skel-line" style={{ width: '30%' }} />
      <div className="shimmer skel-line" style={{ width: '70%', height: 16 }} />
      <div className="shimmer skel-line" style={{ width: '90%' }} />
      <div className="shimmer skel-line" style={{ width: '50%' }} />
    </div>
  )
}

// ─── Comic week override storage ──────────────────────────────────────────────
const COMIC_WEEK_KEY = `ops-comic-week:${ISO_WEEK}`

function loadComicOverride() {
  try { return JSON.parse(localStorage.getItem(COMIC_WEEK_KEY) ?? 'null') } catch { return null }
}
function saveComicOverride(idx) {
  try { localStorage.setItem(COMIC_WEEK_KEY, JSON.stringify(idx)) } catch {}
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [feed, setFeed] = useState(null)
  const [feedError, setFeedError] = useState(null)
  const [comics, setComics] = useState(null)
  const [comicsError, setComicsError] = useState(null)

  // Derived once comics load
  const defaultComicIdx = comics ? ISO_WEEK % comics.length : 0
  const [comicOverride, setComicOverride] = useState(loadComicOverride)
  const comicIdx = comicOverride ?? defaultComicIdx

  const svgRefs = [useRef(), useRef(), useRef(), useRef()]

  // Load static JSON files on mount
  useEffect(() => {
    fetch('/feed.json')
      .then(r => r.json())
      .then(d => setFeed(d))
      .catch(e => setFeedError(e.message))
  }, [])

  useEffect(() => {
    fetch('/comics.json')
      .then(r => r.json())
      .then(d => setComics(d))
      .catch(e => setComicsError(e.message))
  }, [])

  const shuffleComic = useCallback(() => {
    if (!comics) return
    let next = comicIdx
    while (comics.length > 1 && next === comicIdx) next = Math.floor(Math.random() * comics.length)
    setComicOverride(next)
    saveComicOverride(next)
  }, [comics, comicIdx])

  const revertComic = useCallback(() => {
    setComicOverride(null)
    try { localStorage.removeItem(COMIC_WEEK_KEY) } catch {}
  }, [])

  const saveComicJpg = useCallback(async () => {
    if (!comics) return
    const strip = comics[comicIdx]
    const scale = 2
    const PW = W * scale, PH = H * scale
    const titleH = 40 * scale
    const canvas = document.createElement('canvas')
    canvas.width = PW * 2 + 3 * scale
    canvas.height = titleH + PH * 2 + 3 * scale
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#1c1a16'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#f4eede'
    ctx.font = `bold ${15 * scale}px 'Bricolage Grotesque', sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(`${strip.title.toUpperCase()}  ·  STRIP #${comicIdx + 1}  ·  WEEK ${ISO_WEEK}`, canvas.width / 2, 26 * scale)

    for (let i = 0; i < 4; i++) {
      const col = i % 2, row = Math.floor(i / 2)
      const svgEl = svgRefs[i].current
      if (!svgEl) continue
      const clone = svgEl.cloneNode(true)
      clone.setAttribute('width', PW)
      clone.setAttribute('height', PH)
      const svgStr = new XMLSerializer().serializeToString(clone)
      const blob = new Blob([svgStr], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      await new Promise(resolve => {
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, col * (PW + 3 * scale), titleH + row * (PH + 3 * scale), PW, PH)
          URL.revokeObjectURL(url)
          resolve()
        }
        img.onerror = resolve
        img.src = url
      })
    }

    const slug = strip.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/jpeg', 0.92)
    a.download = `comic-week-${ISO_WEEK}-${slug}.jpg`
    a.click()
  }, [comics, comicIdx])

  // Feed split
  const SEV_ORDER = { high: 0, medium: 1, low: 2 }
  const allItems = feed?.items ?? []
  const actionable = allItems.filter(i => i.actionable).sort((a, b) => (SEV_ORDER[a.severity] ?? 3) - (SEV_ORDER[b.severity] ?? 3))
  const rest = allItems.filter(i => !i.actionable)
  const strip = comics?.[comicIdx]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      <div className="console-wrap">

        {/* Header */}
        <div className="hdr-kicker">Security Operations</div>
        <div className="hdr-title">OPS <span>CONSOLE</span></div>
        <div className="hdr-sub">
          <span>Week {ISO_WEEK} · w/c {WEEK_MONDAY} · Identity &amp; Access</span>
          <span className="spof-badge"><span className="spof-dot" />SPOF: 1 (you)</span>
        </div>

        {/* Feed meta */}
        {feed?.generatedAt && (
          <div className="feed-meta">
            Updated {new Date(feed.generatedAt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · weekly auto-refresh
          </div>
        )}

        {/* Feed */}
        {!feed && !feedError && (
          <>
            <div className="section-label action" style={{ marginTop: 28 }}>Action required</div>
            <SkeletonCard /><SkeletonCard />
            <div className="section-label">Latest in your area</div>
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        )}
        {feedError && (
          <div className="error-card" style={{ marginTop: 24 }}>
            <strong>Could not load feed:</strong> {feedError}
          </div>
        )}
        {feed && (
          <>
            <div className="section-label action">Action required</div>
            {actionable.length === 0
              ? <div className="empty-card">No urgent action items this week — check back after Monday's update.</div>
              : actionable.map((item, i) => <NewsCard key={i} item={item} />)}
            <div className="section-label">Latest in your area</div>
            {rest.length === 0
              ? <div className="empty-card">No other items this week.</div>
              : rest.map((item, i) => <NewsCard key={i} item={item} />)}
          </>
        )}

        {/* Comic */}
        <div className="comic-section">
          <div className="section-label">Comic of the week</div>
          {comicsError && <div className="error-card">Could not load comics: {comicsError}</div>}
          {!comics && !comicsError && <SkeletonCard />}
          {strip && (
            <>
              <div className="comic-header">
                <span className="comic-title-text">{strip.title}</span>
                <span className="comic-strip-label">Strip #{comicIdx + 1} of {comics.length} · Week {ISO_WEEK}</span>
              </div>
              <div className="comic-actions">
                <button className="btn" onClick={shuffleComic}>⇄ Shuffle</button>
                {comicOverride !== null && <button className="btn" onClick={revertComic}>↺ Week's pick</button>}
                <button className="btn" onClick={saveComicJpg}>↓ Save as JPG</button>
              </div>
              <div className="comic-grid">
                {strip.panels.map((panel, i) => (
                  <div key={i} className="comic-panel">
                    <ComicPanel panel={panel} svgRef={svgRefs[i]} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </>
  )
}
