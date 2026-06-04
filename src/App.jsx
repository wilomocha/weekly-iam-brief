import React, { useState, useEffect, useRef, useCallback } from 'react'

// ─── Design tokens injected as a <style> block ───────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=IBM+Plex+Mono:wght@400;500&display=swap');

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

  /* Controls */
  .controls { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin: 20px 0 8px; }
  .focus-wrap { position: relative; flex: 1; min-width: 260px; }
  .focus-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
  .focus-input { width: 100%; background: var(--panel); border: 1px solid var(--border); border-radius: 6px; color: var(--ink); font-family: var(--font-mono); font-size: 12px; padding: 8px 10px 8px 32px; outline: none; transition: border-color 0.15s; }
  .focus-input:focus { border-color: var(--amber); }
  .btn { background: var(--panel); border: 1px solid var(--border); border-radius: 6px; color: var(--ink); font-family: var(--font-mono); font-size: 12px; padding: 8px 16px; cursor: pointer; transition: border-color 0.15s, color 0.15s; white-space: nowrap; }
  .btn:hover { border-color: var(--amber); color: var(--amber); }
  .btn-primary { background: rgba(246,168,33,0.12); border-color: rgba(246,168,33,0.4); color: var(--amber); }
  .btn-primary:hover { background: rgba(246,168,33,0.2); }
  .last-pulled { font-size: 11px; color: var(--muted); margin-bottom: 18px; }

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
  .empty-card { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 24px; color: var(--muted); text-align: center; margin-bottom: 10px; }

  /* Comic section */
  .comic-section { margin-top: 36px; }
  .comic-header { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
  .comic-title-text { font-family: var(--font-display); font-size: 20px; font-weight: 700; color: var(--paper); }
  .comic-strip-label { font-size: 11px; color: var(--muted); }
  .comic-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
  .comic-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; background: var(--paper-ink); border: 2px solid var(--paper-ink); border-radius: 6px; overflow: hidden; }
  .comic-panel svg { display: block; width: 100%; height: auto; }
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

// ─── Comics data ─────────────────────────────────────────────────────────────
const COMICS = [
  {
    title: 'Title Creep',
    panels: [
      { cap: 'Monday', fig: [{ p: 'left', line: 'You own the IAM system.', pose: 'neutral', mood: 'happy' }] },
      { cap: 'Tuesday', fig: [{ p: 'right', line: 'Also security now.', pose: 'point-right', mood: 'worried' }, { p: 'left', line: '…okay?', pose: 'shrug', mood: 'neutral' }] },
      { cap: 'Wednesday', fig: [{ p: 'right', line: 'And the printers.', pose: 'point-right', mood: 'neutral' }, { p: 'left', line: 'The printers?!', pose: 'panic', mood: 'worried' }] },
      { cap: 'Friday', fig: [{ p: 'left', line: 'I just handle Identity & Access.', pose: 'neutral', mood: 'neutral' }, { p: 'right', line: 'Great. The copier needs MFA.', pose: 'neutral', mood: 'happy' }] },
    ],
  },
  {
    title: 'The Bus Factor',
    panels: [
      { cap: null, fig: [{ p: 'right', line: 'What if a bus hits you?', pose: 'neutral', mood: 'worried' }, { p: 'left', line: '…pardon?', pose: 'shrug', mood: 'neutral' }] },
      { cap: null, fig: [{ p: 'right', line: 'Nobody can reset passwords!', pose: 'panic', mood: 'worried' }] },
      { cap: null, fig: [{ p: 'left', line: 'So… don\'t get hit by a bus?', pose: 'neutral', mood: 'neutral' }] },
      { cap: null, fig: [{ p: 'right', line: 'That\'s your continuity plan?', pose: 'point-right', mood: 'worried' }, { p: 'left', line: 'Bus factor: 1.', pose: 'shrug', mood: 'neutral' }] },
    ],
  },
  {
    title: 'Just In Case',
    panels: [
      { cap: null, fig: [{ p: 'right', line: 'I need access to everything.', pose: 'neutral', mood: 'happy' }, { p: 'left', line: 'Everything?', pose: 'neutral', mood: 'worried' }] },
      { cap: null, fig: [{ p: 'right', line: 'Just in case! You never know.', pose: 'shrug', mood: 'neutral' }] },
      { cap: null, fig: [{ p: 'left', line: 'What\'s the actual use case?', pose: 'point-right', mood: 'neutral' }, { p: 'right', line: '…vibes mostly.', pose: 'shrug', mood: 'happy' }] },
      { cap: null, fig: [{ p: 'left', line: 'Here\'s read-only on staging.', pose: 'neutral', mood: 'neutral' }, { p: 'right', line: 'That\'s not everything!', pose: 'panic', mood: 'worried' }, { p: 'left', line: 'Correct.', pose: 'neutral', mood: 'neutral' }] },
    ],
  },
  {
    title: 'The Ghost Account',
    panels: [
      { cap: null, fig: [{ p: 'right', line: 'What\'s svc-legacy-admin?', pose: 'point-right', mood: 'neutral' }, { p: 'left', line: 'Do. Not. Touch. It.', pose: 'neutral', mood: 'worried' }] },
      { cap: null, fig: [{ p: 'right', line: 'It has admin on everything!', pose: 'panic', mood: 'worried' }] },
      { cap: null, fig: [{ p: 'left', line: 'I know. We\'re afraid of it.', pose: 'shrug', mood: 'neutral' }, { p: 'right', line: 'Who owns it?', pose: 'neutral', mood: 'neutral' }] },
      { cap: null, fig: [{ p: 'left', line: 'Dave. Dave left in 2019.', pose: 'neutral', mood: 'worried' }, { p: 'right', line: 'Rotate it!', pose: 'point-right', mood: 'worried' }, { p: 'left', line: 'Last time we tried, billing broke.', pose: 'shrug', mood: 'neutral' }] },
    ],
  },
  {
    title: 'Friday, 4:59 PM',
    panels: [
      { cap: '4:59 PM Friday', fig: [{ p: 'left', line: 'Have a great weekend!', pose: 'neutral', mood: 'happy' }] },
      { cap: '5:00 PM', fig: [{ p: 'right', line: 'Help. I\'m locked out.', pose: 'panic', mood: 'worried' }] },
      { cap: null, fig: [{ p: 'left', line: '…how?', pose: 'shrug', mood: 'neutral' }, { p: 'right', line: 'MFA phone is dead. And lost.', pose: 'shrug', mood: 'worried' }] },
      { cap: 'Monday, 9 AM', fig: [{ p: 'left', line: 'Back in?', pose: 'neutral', mood: 'neutral' }, { p: 'right', line: 'I worked from my tablet.', pose: 'shrug', mood: 'neutral' }, { p: 'left', line: 'Please set up backup MFA.', pose: 'point-right', mood: 'worried' }] },
    ],
  },
  {
    title: 'Quarterly Review',
    panels: [
      { cap: 'Access Review', fig: [{ p: 'left', line: '200 accounts to review.', pose: 'neutral', mood: 'neutral' }, { p: 'right', line: 'I\'ll knock it out quick.', pose: 'neutral', mood: 'happy' }] },
      { cap: '3 minutes later', fig: [{ p: 'right', line: 'Approved! All done.', pose: 'neutral', mood: 'happy' }] },
      { cap: null, fig: [{ p: 'left', line: 'You approved the contractor from 2021?', pose: 'point-right', mood: 'worried' }, { p: 'right', line: 'All looked fine to me!', pose: 'shrug', mood: 'neutral' }] },
      { cap: null, fig: [{ p: 'left', line: 'They haven\'t worked here in 3 years.', pose: 'neutral', mood: 'worried' }, { p: 'right', line: 'So… re-review?', pose: 'shrug', mood: 'neutral' }] },
    ],
  },
  {
    title: 'But It\'s Annoying',
    panels: [
      { cap: null, fig: [{ p: 'right', line: 'Can you turn off MFA for me?', pose: 'neutral', mood: 'happy' }, { p: 'left', line: 'No.', pose: 'neutral', mood: 'neutral' }] },
      { cap: null, fig: [{ p: 'right', line: 'It\'s SO annoying to use!', pose: 'panic', mood: 'worried' }] },
      { cap: null, fig: [{ p: 'left', line: 'You know what\'s more annoying?', pose: 'point-right', mood: 'neutral' }] },
      { cap: null, fig: [{ p: 'left', line: 'A breach.', pose: 'neutral', mood: 'neutral' }, { p: 'right', line: '…fine.', pose: 'shrug', mood: 'neutral' }] },
    ],
  },
  {
    title: 'Who Owns This?',
    panels: [
      { cap: 'All-hands', fig: [{ p: 'center', line: 'Who owns the IAM system?', pose: 'neutral', mood: 'neutral' }] },
      { cap: null, fig: [{ p: 'left', line: '*points right*', pose: 'point-right', mood: 'neutral' }, { p: 'right', line: '*points left*', pose: 'point-left', mood: 'neutral' }] },
      { cap: null, fig: [{ p: 'center', line: 'Everyone is pointing at you.', pose: 'neutral', mood: 'worried' }] },
      { cap: null, fig: [{ p: 'left', line: 'Bus factor: 1.', pose: 'shrug', mood: 'neutral' }, { p: 'right', line: 'Classic.', pose: 'neutral', mood: 'neutral' }] },
    ],
  },
  {
    title: 'Paid Time Off',
    panels: [
      { cap: null, fig: [{ p: 'left', line: 'Taking PTO next week!', pose: 'neutral', mood: 'happy' }, { p: 'right', line: 'Great! Bring your laptop.', pose: 'neutral', mood: 'happy' }] },
      { cap: null, fig: [{ p: 'left', line: '…why?', pose: 'neutral', mood: 'worried' }, { p: 'right', line: 'Just in case.', pose: 'shrug', mood: 'neutral' }] },
      { cap: 'Day 1 of PTO', fig: [{ p: 'right', line: 'Quick question about provisioning…', pose: 'point-right', mood: 'neutral' }] },
      { cap: null, fig: [{ p: 'left', line: 'This is not really PTO.', pose: 'shrug', mood: 'worried' }, { p: 'right', line: 'Think of it as… remote work!', pose: 'neutral', mood: 'happy' }] },
    ],
  },
  {
    title: 'We Do Not Speak Of It',
    panels: [
      { cap: null, fig: [{ p: 'right', line: 'This key was last rotated… 2018?', pose: 'point-right', mood: 'worried' }] },
      { cap: null, fig: [{ p: 'left', line: 'We don\'t talk about that key.', pose: 'neutral', mood: 'neutral' }] },
      { cap: null, fig: [{ p: 'right', line: 'Shouldn\'t we rotate it?', pose: 'neutral', mood: 'neutral' }, { p: 'left', line: 'Last engineer who tried is gone.', pose: 'shrug', mood: 'neutral' }] },
      { cap: null, fig: [{ p: 'right', line: 'They quit?', pose: 'neutral', mood: 'worried' }, { p: 'left', line: 'Promoted. To a quieter team.', pose: 'neutral', mood: 'neutral' }] },
    ],
  },
  {
    title: 'Onboarding',
    panels: [
      { cap: 'Week 1', fig: [{ p: 'right', line: 'New hire needs access!', pose: 'neutral', mood: 'happy' }, { p: 'left', line: 'Three approvals required.', pose: 'neutral', mood: 'neutral' }] },
      { cap: 'Week 2', fig: [{ p: 'left', line: 'Still waiting on approval 2.', pose: 'shrug', mood: 'neutral' }] },
      { cap: 'Week 3', fig: [{ p: 'left', line: 'All approved! Access granted.', pose: 'neutral', mood: 'happy' }] },
      { cap: 'Week 4', fig: [{ p: 'right', line: 'They quit yesterday.', pose: 'shrug', mood: 'worried' }, { p: 'left', line: 'Deprovision immediately then.', pose: 'neutral', mood: 'neutral' }] },
    ],
  },
  {
    title: 'It\'s Documented',
    panels: [
      { cap: null, fig: [{ p: 'right', line: 'Where\'s the runbook for this?', pose: 'neutral', mood: 'neutral' }, { p: 'left', line: 'It\'s documented.', pose: 'neutral', mood: 'neutral' }] },
      { cap: null, fig: [{ p: 'right', line: 'Where?', pose: 'neutral', mood: 'neutral' }, { p: 'left', line: 'My head.', pose: 'point-left', mood: 'neutral' }] },
      { cap: null, fig: [{ p: 'right', line: '…write it down?', pose: 'neutral', mood: 'worried' }, { p: 'left', line: 'I know where it is.', pose: 'shrug', mood: 'neutral' }] },
      { cap: 'Bus factor: still 1', fig: [{ p: 'right', line: 'Bus factor intensifies.', pose: 'panic', mood: 'worried' }, { p: 'left', line: 'I\'m fine!', pose: 'neutral', mood: 'happy' }] },
    ],
  },
]

// ─── SVG Comic Panel Renderer ─────────────────────────────────────────────────
const W = 260, H = 180

function wrapText(text, maxChars) {
  const words = text.split(' ')
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
  if (pose === 'panic') { lax = hx - 22; lax2 = hx - 12; rax = hx + 22; rax2 = hx + 12; lly = hy + 60; rly = hy + 60 }
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

function SpeechBubble({ text, tailX, tailDir, bx, by, maxW = 100 }) {
  const lines = wrapText(text, 18)
  const bh = lines.length * 16 + 10
  const bw = Math.min(maxW, Math.max(60, ...lines.map(l => l.length * 6 + 10)))
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

function ComicPanel({ panel, panelRef }) {
  const { cap, fig } = panel
  const capH = cap ? 20 : 0
  const figureXmap = { left: 60, center: 130, right: 200 }

  const bubbles = fig.map((f, i) => {
    const fx = figureXmap[f.p] || 130
    const bw = 110
    let bx = f.p === 'right' ? Math.max(4, fx - bw - 4) : Math.min(W - bw - 4, fx + 4)
    if (f.p === 'center') bx = (W - bw) / 2
    const by = 4
    return { ...f, fx, bx, by, bw }
  })

  const figTop = Math.max(...bubbles.map(b => {
    const lines = wrapText(b.line, 18)
    return b.by + lines.length * 16 + 10 + 16
  }))

  return (
    <svg ref={panelRef} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" style={{ background: '#fbf7ec' }}>
      <rect x={0} y={0} width={W} height={H} fill="#fbf7ec" />
      {bubbles.map((b, i) => (
        <SpeechBubble key={i} text={b.line} tailX={b.fx} bx={b.bx} by={b.by} maxW={b.bw} />
      ))}
      {fig.map((f, i) => {
        const fx = figureXmap[f.p] || 130
        return <StickFigure key={i} x={fx} pose={f.pose} mood={f.mood} />
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

// ─── News Card ─────────────────────────────────────────────────────────────────
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

// ─── Skeleton ──────────────────────────────────────────────────────────────────
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

// ─── Storage helpers ──────────────────────────────────────────────────────────
const LS_KEY = 'ops-console:v1'
function loadState() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null') } catch { return null }
}
function saveState(s) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)) } catch {}
}

const DEFAULT_FOCUS = 'Identity & Access Management (IAM) security: CVEs, vendor advisories (Okta, Microsoft Entra/Azure AD, Ping), credential/identity breaches, CISA guidance'

// ─── Comic week key ───────────────────────────────────────────────────────────
const COMIC_WEEK_KEY = `ops-comic-week:${ISO_WEEK}`

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const saved = loadState()

  const [focus, setFocus] = useState(saved?.focus ?? DEFAULT_FOCUS)
  const [items, setItems] = useState(saved?.items ?? null)
  const [lastPulled, setLastPulled] = useState(saved?.lastPulled ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const defaultComicIdx = ISO_WEEK % COMICS.length
  const [comicIdx, setComicIdx] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(COMIC_WEEK_KEY) || 'null')
      return stored ?? defaultComicIdx
    } catch { return defaultComicIdx }
  })

  const panelRefs = [useRef(), useRef(), useRef(), useRef()]

  const fetchFeed = useCallback(async (focusStr) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focus: focusStr }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const ts = new Date().toLocaleString()
      setItems(data.items)
      setLastPulled(ts)
      saveState({ focus: focusStr, items: data.items, lastPulled: ts })
    } catch (e) {
      setError(e.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-fetch once on first load if no cache
  useEffect(() => {
    if (!items) fetchFeed(focus)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = () => {
    saveState({ focus, items, lastPulled })
    fetchFeed(focus)
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleRefresh() }

  const shuffleComic = () => {
    let next = comicIdx
    while (next === comicIdx) next = Math.floor(Math.random() * COMICS.length)
    setComicIdx(next)
    try { localStorage.setItem(COMIC_WEEK_KEY, JSON.stringify(next)) } catch {}
  }

  const revertComic = () => {
    setComicIdx(defaultComicIdx)
    try { localStorage.setItem(COMIC_WEEK_KEY, JSON.stringify(defaultComicIdx)) } catch {}
  }

  const saveComicJpg = async () => {
    const strip = COMICS[comicIdx]
    const scale = 2
    const PW = W * scale, PH = H * scale
    const cols = 2, rows = 2
    const titleH = 40 * scale
    const canvas = document.createElement('canvas')
    canvas.width = PW * cols + 3 * scale
    canvas.height = titleH + PH * rows + 3 * scale
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#1c1a16'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#f4eede'
    ctx.font = `bold ${16 * scale}px 'Bricolage Grotesque', sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(`${strip.title.toUpperCase()}  ·  STRIP #${comicIdx + 1}  ·  WEEK ${ISO_WEEK}`, canvas.width / 2, 26 * scale)

    for (let i = 0; i < 4; i++) {
      const col = i % 2, row = Math.floor(i / 2)
      const svgEl = panelRefs[i].current?.closest('svg') || panelRefs[i].current
      if (!svgEl) continue
      const clone = svgEl.cloneNode(true)
      clone.setAttribute('width', PW)
      clone.setAttribute('height', PH)
      const svgStr = new XMLSerializer().serializeToString(clone)
      const blob = new Blob([svgStr], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      await new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          const ox = col * (PW + 3 * scale)
          const oy = titleH + row * (PH + 3 * scale)
          ctx.drawImage(img, ox, oy, PW, PH)
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
  }

  const actionable = (items || []).filter(i => i.actionable).sort((a, b) => {
    const ord = { high: 0, medium: 1, low: 2 }
    return (ord[a.severity] ?? 3) - (ord[b.severity] ?? 3)
  })
  const rest = (items || []).filter(i => !i.actionable)
  const strip = COMICS[comicIdx]

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

        {/* Controls */}
        <div className="controls">
          <div className="focus-wrap">
            <span className="focus-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input
              className="focus-input"
              value={focus}
              onChange={e => setFocus(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Focus area…"
            />
          </div>
          <button className="btn btn-primary" onClick={handleRefresh} disabled={loading}>
            {loading ? 'Fetching…' : 'Refresh feed'}
          </button>
        </div>
        {lastPulled && <div className="last-pulled">Last pulled {lastPulled} · live web search</div>}

        {/* Feed */}
        {loading && (
          <>
            <div className="section-label action">Action required</div>
            <SkeletonCard /><SkeletonCard />
            <div className="section-label">Latest in your area</div>
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        )}
        {!loading && error && (
          <div className="error-card">
            <strong>Error fetching feed:</strong> {error}
            <br /><br />
            <button className="btn" onClick={handleRefresh}>Try again</button>
          </div>
        )}
        {!loading && !error && items && (
          <>
            <div className="section-label action">Action required</div>
            {actionable.length === 0 ? <div className="empty-card">No urgent action items this week.</div> : actionable.map((item, i) => <NewsCard key={i} item={item} />)}
            <div className="section-label">Latest in your area</div>
            {rest.length === 0 ? <div className="empty-card">No other items this week.</div> : rest.map((item, i) => <NewsCard key={i} item={item} />)}
          </>
        )}

        {/* Comic */}
        <div className="comic-section">
          <div className="section-label">Comic of the week</div>
          <div className="comic-header">
            <span className="comic-title-text">{strip.title}</span>
            <span className="comic-strip-label">Strip #{comicIdx + 1} · Week {ISO_WEEK}</span>
          </div>
          <div className="comic-actions">
            <button className="btn" onClick={shuffleComic}>⇄ Shuffle</button>
            {comicIdx !== defaultComicIdx && <button className="btn" onClick={revertComic}>↺ Week's pick</button>}
            <button className="btn" onClick={saveComicJpg}>↓ Save as JPG</button>
          </div>
          <div className="comic-grid">
            {strip.panels.map((panel, i) => (
              <div key={i} className="comic-panel">
                <ComicPanel panel={panel} panelRef={panelRefs[i]} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}
