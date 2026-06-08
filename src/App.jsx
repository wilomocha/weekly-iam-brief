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
    --paper-ink: #1c1a16;
    --font-display: 'Bricolage Grotesque', sans-serif;
    --font-mono: 'IBM Plex Mono', monospace;
    --font-comic: 'Caveat', cursive;
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

  .console-wrap { max-width: 920px; margin: 0 auto; padding: 32px 20px 80px; }

  /* Header */
  .hdr-kicker { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.18em; color: var(--muted); text-transform: uppercase; margin-bottom: 4px; }
  .hdr-title { font-family: var(--font-display); font-size: clamp(32px,6vw,52px); font-weight: 800; line-height: 1; margin-bottom: 6px; }
  .hdr-title span { color: var(--amber); }
  .hdr-sub { font-size: 11px; color: var(--muted); display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .spof-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(248,115,107,0.12); border: 1px solid rgba(248,115,107,0.35); border-radius: 20px; padding: 2px 10px; font-size: 11px; color: var(--red); font-weight: 500; }
  .spof-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--red); animation: pulse 2s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.75)} }

  /* Section labels */
  .section-label { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); border-bottom: 1px solid var(--border); padding-bottom: 6px; margin-bottom: 14px; margin-top: 36px; }
  .section-label.action { color: var(--amber); border-color: rgba(246,168,33,0.35); }
  .section-label.comic-label { margin-top: 20px; }

  /* Feed meta */
  .feed-meta { font-size: 11px; color: var(--muted); margin: 6px 0 0; }

  /* News cards */
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

  /* Shimmer */
  .shimmer { background: linear-gradient(90deg, var(--panel) 25%, #1e2530 50%, var(--panel) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 4px; }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .skel-line { height: 12px; margin-bottom: 8px; border-radius: 3px; }

  .error-card { background: rgba(248,115,107,0.08); border: 1px solid rgba(248,115,107,0.3); border-radius: 8px; padding: 16px; color: var(--red); margin-bottom: 10px; }
  .empty-card { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 24px; color: var(--muted); text-align: center; margin-bottom: 10px; font-size: 12px; }

  /* Comic */
  .comic-header { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
  .comic-title-text { font-family: var(--font-display); font-size: 22px; font-weight: 700; color: var(--paper); }
  .comic-strip-label { font-size: 11px; color: var(--muted); }
  .comic-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
  .comic-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    border: 3px solid #1a1714;
    border-radius: 3px;
    overflow: hidden;
    background: #1a1714;
    box-shadow: 0 6px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4);
    max-width: 860px;
  }
  .comic-panel svg { display: block; width: 100%; height: auto; }
  .comic-panel:nth-child(1), .comic-panel:nth-child(2) { border-bottom: 2px solid #1a1714; }
  .comic-panel:nth-child(odd) { border-right: 1px solid #1a1714; }
  .comic-panel:nth-child(even) { border-left: 1px solid #1a1714; }

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
  const date = new Date(d); const day = date.getDay() || 7
  date.setDate(date.getDate() - day + 1)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
const now = new Date()
const ISO_WEEK = getISOWeek(now)
const WEEK_MONDAY = getWeekMonday(now)

// ─── Comic strip data ─────────────────────────────────────────────────────────
const COMICS = [
  {
    title: 'Break Glass Theater',
    premise: 'The emergency break-glass account is locked behind the same approval workflow it exists to bypass.',
    panels: [
      { cap: null, beats: [
        { speaker: 'B', side: 'right', text: 'Break-glass is for real emergencies only.', emotion: 'flat' },
        { speaker: 'A', side: 'left',  text: 'Understood.', emotion: 'flat' },
      ]},
      { cap: '3am. Production down.', beats: [
        { speaker: 'A', side: 'left', text: 'This is a real emergency. Break-glass time.', emotion: 'worried' },
      ]},
      { cap: null, beats: [
        { speaker: 'B', side: 'right', text: 'Submit form CF-44B and wait for approver.', emotion: 'flat' },
        { speaker: 'A', side: 'left',  text: "But— that's what break-glass bypasses—", emotion: 'shocked' },
      ]},
      { cap: null, beats: [
        { speaker: 'B', side: 'right', text: 'Approval SLA: 48 hours.', emotion: 'flat' },
        { speaker: 'A', side: 'left',  text: 'The irony is loud.', emotion: 'angry' },
      ]},
    ],
  },
  {
    title: 'Permission Inheritance',
    premise: 'A dev accumulates access every time they change teams and nobody ever cleans it up.',
    panels: [
      { cap: 'Joined team A', beats: [{ speaker: 'none', side: null, text: 'Got read access to staging.', emotion: 'flat' }] },
      { cap: 'Moved to team B', beats: [{ speaker: 'none', side: null, text: 'Got prod write. Kept team A access.', emotion: 'flat' }] },
      { cap: 'Moved to team C', beats: [{ speaker: 'none', side: null, text: 'Got billing admin. Kept everything else.', emotion: 'flat' }] },
      { cap: 'Annual audit', beats: [
        { speaker: 'B', side: 'right', text: 'You have more access than the CEO.', emotion: 'worried' },
        { speaker: 'A', side: 'left',  text: "I've never cleaned anything up.", emotion: 'flat' },
        { speaker: 'B', side: 'right', text: 'We know.', emotion: 'flat' },
      ]},
    ],
  },
  {
    title: 'The Shared Account',
    premise: 'One database account, 47 users, simultaneous logins from three continents.',
    panels: [
      { cap: null, beats: [
        { speaker: 'A', side: 'left',  text: 'Who changed the prod DB password?', emotion: 'worried' },
        { speaker: 'B', side: 'right', text: 'Not me.', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left',  text: 'The account has 47 users.', emotion: 'flat' },
        { speaker: 'B', side: 'right', text: '3 simultaneous logins. Different continents.', emotion: 'worried' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left',  text: 'Can we trace who did it?', emotion: 'flat' },
        { speaker: 'B', side: 'right', text: 'Audit trail says: db_shared_user.', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left',  text: 'Has it always been like this?', emotion: 'worried' },
        { speaker: 'B', side: 'right', text: 'Since 2015.', emotion: 'flat' },
        { speaker: 'A', side: 'left',  text: 'Cool.', emotion: 'flat' },
      ]},
    ],
  },
  {
    title: 'Credential Archaeology',
    premise: 'A file named TEMP_PASSWORDS_DELETE_THIS.xlsx from 2016 is on 12 backup drives.',
    panels: [
      { cap: null, beats: [
        { speaker: 'A', side: 'left',  text: 'Found: TEMP_PASSWORDS_DELETE_THIS.xlsx', emotion: 'flat' },
        { speaker: 'B', side: 'right', text: 'From when?', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left',  text: '2016. 847 rows. On 12 backup drives.', emotion: 'flat' },
        { speaker: 'B', side: 'right', text: "That's every password we've ever used.", emotion: 'shocked' },
      ]},
      { cap: null, beats: [
        { speaker: 'B', side: 'right', text: 'Are any still active?', emotion: 'worried' },
      ]},
      { cap: '…pause…', beats: [
        { speaker: 'A', side: 'left',  text: 'Yes.', emotion: 'flat' },
        { speaker: 'B', side: 'right', text: 'How many?', emotion: 'shocked' },
        { speaker: 'A', side: 'left',  text: 'All of them.', emotion: 'flat' },
      ]},
    ],
  },
  {
    title: 'MFA Debt Spiral',
    premise: 'Lost phone. IT takes 14 days to reset MFA. Everything needs MFA to work.',
    panels: [
      { cap: null, beats: [
        { speaker: 'A', side: 'left',  text: 'I lost my phone. Need MFA reset.', emotion: 'worried' },
        { speaker: 'B', side: 'right', text: 'Policy: 14 business days + in-person ID.', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left',  text: 'My laptop requires MFA to unlock.', emotion: 'worried' },
        { speaker: 'B', side: 'right', text: 'Right.', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left',  text: 'Email requires MFA to access the form.', emotion: 'angry' },
        { speaker: 'B', side: 'right', text: 'Also right.', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left',  text: "How do I work for 14 days?", emotion: 'shocked' },
        { speaker: 'B', side: 'right', text: "You don't.", emotion: 'flat' },
      ]},
    ],
  },
  {
    title: 'Role Roulette',
    premise: 'The Database Admin role grants Slack, GitHub, and printer admin. Nobody knows why.',
    panels: [
      { cap: null, beats: [
        { speaker: 'A', side: 'left',  text: 'Why does DB Admin have Slack admin?', emotion: 'flat' },
        { speaker: 'B', side: 'right', text: 'Legacy reasons.', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left',  text: 'And GitHub admin? And printer admin?', emotion: 'worried' },
        { speaker: 'B', side: 'right', text: 'Someone needed it once. Easier to add.', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left',  text: 'In 2017?', emotion: 'flat' },
        { speaker: 'B', side: 'right', text: "We've been adding ever since.", emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left',  text: "This isn't a role. It's a wishlist.", emotion: 'angry' },
        { speaker: 'B', side: 'right', text: '…yes.', emotion: 'flat' },
      ]},
    ],
  },
  {
    title: 'Least Privilege Paradox',
    premise: 'No prod access for devs. Production breaks. They cannot see the logs to fix it.',
    panels: [
      { cap: null, beats: [
        { speaker: 'A', side: 'left',  text: 'Prod is broken. I need the logs.', emotion: 'worried' },
        { speaker: 'B', side: 'right', text: 'No prod access for devs. Policy.', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left',  text: "Can YOU check?", emotion: 'flat' },
        { speaker: 'B', side: 'right', text: 'Submit a ticket. SLA: 4 hours.', emotion: 'flat' },
        { speaker: 'A', side: 'left',  text: "It's down NOW.", emotion: 'angry' },
      ]},
      { cap: '4 hours later', beats: [
        { speaker: 'B', side: 'right', text: 'Access approved. What do you need?', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left',  text: 'Fixed it. Guessed and restarted.', emotion: 'flat' },
        { speaker: 'B', side: 'right', text: 'Very secure.', emotion: 'flat' },
        { speaker: 'A', side: 'left',  text: 'Very.', emotion: 'flat' },
      ]},
    ],
  },
  {
    title: 'The sudo !! Incident',
    premise: 'Junior dev escalates the wrong command with sudo !! and becomes an incident report legend.',
    panels: [
      { cap: null, beats: [
        { speaker: 'A', side: 'left',  text: 'I typed sudo !! by accident.', emotion: 'worried' },
        { speaker: 'B', side: 'right', text: 'What was the previous command?', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left', text: 'rm -rf /', emotion: 'shocked' },
      ]},
      { cap: '…', beats: [
        { speaker: 'B', side: 'right', text: '…', emotion: 'shocked' },
        { speaker: 'A', side: 'left',  text: '…', emotion: 'shocked' },
      ]},
      { cap: null, beats: [
        { speaker: 'B', side: 'right', text: 'Call backups. Now.', emotion: 'angry' },
        { speaker: 'A', side: 'left',  text: "It's probably fine.", emotion: 'worried' },
        { speaker: 'B', side: 'right', text: 'It is not fine.', emotion: 'angry' },
      ]},
    ],
  },
  {
    title: 'Approver Roulette',
    premise: 'Access request bounces between approvers for weeks and auto-closes with no action.',
    panels: [
      { cap: 'Week 1', beats: [
        { speaker: 'none', side: null, text: 'Request sent to Alice.', emotion: 'flat' },
        { speaker: 'A',    side: 'left', text: 'Ask Bob.', emotion: 'flat' },
      ]},
      { cap: 'Week 2', beats: [
        { speaker: 'B', side: 'right', text: 'Ask Carol.', emotion: 'flat' },
        { speaker: 'none', side: null, text: 'Carol: ask Alice.', emotion: 'flat' },
      ]},
      { cap: 'Week 3', beats: [
        { speaker: 'none', side: null, text: 'Alice is on sabbatical.', emotion: 'flat' },
      ]},
      { cap: 'Day 30', beats: [
        { speaker: 'none', side: null, text: 'REQUEST AUTO-CLOSED: No Response.', emotion: 'flat' },
        { speaker: 'B', side: 'right', text: "I'll resubmit.", emotion: 'worried' },
        { speaker: 'A', side: 'left',  text: 'See you in month two.', emotion: 'flat' },
      ]},
    ],
  },
  {
    title: 'Compliance Theater',
    premise: 'Annual access review. Manager approves everything in 3 minutes without reading it.',
    panels: [
      { cap: 'Access Review Day', beats: [
        { speaker: 'none', side: null, text: 'Certify your permissions are correct.', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'B', side: 'right', text: 'Do you know what half these systems are?', emotion: 'worried' },
        { speaker: 'A', side: 'left',  text: 'No.', emotion: 'flat' },
      ]},
      { cap: '3 minutes later', beats: [
        { speaker: 'A', side: 'left', text: '[Clicks Approve All]', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'none', side: null, text: 'COMPLIANCE SCORE: 100% ✓', emotion: 'flat' },
        { speaker: 'B', side: 'right', text: 'Certified chaos.', emotion: 'flat' },
        { speaker: 'A', side: 'left',  text: 'Same time next year.', emotion: 'flat' },
      ]},
    ],
  },
  {
    title: 'Dave Lives On',
    premise: 'Dave left 18 months ago. His admin creds are in a shared doc his old team still uses.',
    panels: [
      { cap: null, beats: [
        { speaker: 'B', side: 'right', text: 'Did we deprovision Dave? He left 18 months ago.', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left', text: 'Dave has admin on prod, staging, billing…', emotion: 'shocked' },
        { speaker: 'A', side: 'left', text: 'And he logged in last week.', emotion: 'worried' },
      ]},
      { cap: null, beats: [
        { speaker: 'B', side: 'right', text: 'WHAT.', emotion: 'angry' },
        { speaker: 'A', side: 'left',  text: "His creds are in a doc his old team uses.", emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'B', side: 'right', text: "We've been logging in as Dave for 18 months.", emotion: 'shocked' },
        { speaker: 'A', side: 'left',  text: 'Dave lives on.', emotion: 'flat' },
        { speaker: 'B', side: 'right', text: 'Revoke Dave.', emotion: 'angry' },
      ]},
    ],
  },
  {
    title: "Quick Test Don't Mind This",
    premise: "Developer commits .env with prod keys to a public repo. Commit: 'quick test don't mind this'.",
    panels: [
      { cap: null, beats: [
        { speaker: 'B', side: 'right', text: 'Why is our API key rotating every hour?', emotion: 'flat' },
        { speaker: 'A', side: 'left',  text: 'Security alert triggered.', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left',  text: 'Someone committed a .env to a public repo.', emotion: 'worried' },
        { speaker: 'B', side: 'right', text: 'Commit message?', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left', text: "\"quick test don't mind this\"", emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'B', side: 'right', text: 'Prod keys, DB passwords, CEO home address.', emotion: 'shocked' },
        { speaker: 'A', side: 'left',  text: 'Rotating everything.', emotion: 'worried' },
        { speaker: 'B', side: 'right', text: 'Rotate faster.', emotion: 'angry' },
      ]},
    ],
  },
]

// ─── SVG Panel Renderer ───────────────────────────────────────────────────────
// Panel dimensions
const PW = 340, PH = 260
const CAP_H = 22

// Figure anchors
const FX = { A: 60, B: PW - 60, C: PW / 2 }
// Figure geometry
const HEAD_R = 13, TORSO = 36, LEG = 30, ARM_LEN = 20

// Bottom of feet
const FEET_Y = PH - CAP_H - 10
// Head center Y
const HEAD_Y = FEET_Y - LEG - TORSO - HEAD_R

// Emotion → arm angles (degrees from vertical, left arm, right arm, shoulder offset)
const ARMS = {
  flat:    { l: [-30, 20], r: [30, 20] },
  worried: { l: [-40, 10], r: [40, 10] },
  angry:   { l: [-50, 5],  r: [50, 5]  },
  shocked: { l: [-70, -5], r: [70, -5] },
  happy:   { l: [-25, -10], r: [25, -10] },
}

function deg2rad(d) { return d * Math.PI / 180 }

function Figure({ x, emotion = 'flat', facing = 1 }) {
  const hx = x, hy = HEAD_Y
  const neckY = hy + HEAD_R
  const hipY = neckY + TORSO
  const shoulderY = neckY + TORSO * 0.3
  const cfg = ARMS[emotion] || ARMS.flat

  // Eye positions — always facing inward (toward center)
  const eyeSign = facing // 1 = facing right, -1 = facing left
  const e1x = hx + eyeSign * 4, e2x = hx + eyeSign * 8

  // Mouth
  let mouthD
  if (emotion === 'happy')   mouthD = `M${hx-5},${hy+5} Q${hx},${hy+9} ${hx+5},${hy+5}`
  else if (emotion === 'angry') mouthD = `M${hx-5},${hy+6} Q${hx},${hy+3} ${hx+5},${hy+6}`
  else if (emotion === 'worried') mouthD = `M${hx-5},${hy+6} Q${hx},${hy+3} ${hx+5},${hy+6}`
  else if (emotion === 'shocked') mouthD = `M${hx-3},${hy+4} Q${hx},${hy+9} ${hx+3},${hy+4}`
  else mouthD = `M${hx-5},${hy+5} L${hx+5},${hy+5}`

  // Arms: l=left, r=right from figure's perspective
  const la = cfg.l, ra = cfg.r
  const lArmEndX = hx - ARM_LEN * Math.sin(deg2rad(Math.abs(la[0])))
  const lArmEndY = shoulderY + ARM_LEN * Math.cos(deg2rad(Math.abs(la[0])))
  const rArmEndX = hx + ARM_LEN * Math.sin(deg2rad(Math.abs(ra[0])))
  const rArmEndY = shoulderY + ARM_LEN * Math.cos(deg2rad(Math.abs(ra[0])))
  // Forearm
  const lElbowX = (hx + lArmEndX) / 2, lElbowY = shoulderY + 12
  const rElbowX = (hx + rArmEndX) / 2, rElbowY = shoulderY + 12

  return (
    <g>
      {/* Head */}
      <circle cx={hx} cy={hy} r={HEAD_R} fill="#faf8f2" stroke="#1a1714" strokeWidth="2" />
      {/* Eyes */}
      <circle cx={e1x} cy={hy - 3} r={1.8} fill="#1a1714" />
      <circle cx={e2x} cy={hy - 3} r={1.8} fill="#1a1714" />
      {/* Emotion extras */}
      {emotion === 'shocked' && <text x={hx + eyeSign * 16} y={hy - 10} fontSize="12" fill="#1a1714" fontFamily="sans-serif">!</text>}
      {emotion === 'angry' && <>
        <line x1={e1x - 3} y1={hy - 8} x2={e1x + 3} y2={hy - 5} stroke="#1a1714" strokeWidth="1.5" />
        <line x1={e2x - 3} y1={hy - 5} x2={e2x + 3} y2={hy - 8} stroke="#1a1714" strokeWidth="1.5" />
      </>}
      {/* Mouth */}
      <path d={mouthD} fill="none" stroke="#1a1714" strokeWidth="1.8" strokeLinecap="round" />
      {/* Torso */}
      <line x1={hx} y1={neckY} x2={hx} y2={hipY} stroke="#1a1714" strokeWidth="2.2" strokeLinecap="round" />
      {/* Arms */}
      <line x1={hx} y1={shoulderY} x2={lArmEndX} y2={lArmEndY} stroke="#1a1714" strokeWidth="2" strokeLinecap="round" />
      <line x1={hx} y1={shoulderY} x2={rArmEndX} y2={rArmEndY} stroke="#1a1714" strokeWidth="2" strokeLinecap="round" />
      {/* Legs */}
      <line x1={hx} y1={hipY} x2={hx - 12} y2={FEET_Y} stroke="#1a1714" strokeWidth="2" strokeLinecap="round" />
      <line x1={hx} y1={hipY} x2={hx + 12} y2={FEET_Y} stroke="#1a1714" strokeWidth="2" strokeLinecap="round" />
    </g>
  )
}

// Wrap text to lines given max pixel width, using Caveat font ~10px
function wrapText(text, maxPx, charPx = 9.5) {
  const max = Math.floor(maxPx / charPx)
  const words = String(text).split(' ')
  const lines = []
  let cur = ''
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w
    if (test.length > max && cur) { lines.push(cur); cur = w }
    else cur = test
  }
  if (cur) lines.push(cur)
  return lines
}

// Single speech bubble — returns { element, height }
function Bubble({ lines, bx, by, bw, tailX, tailY, narration }) {
  const LH = 16, pad = 10
  const bh = lines.length * LH + pad
  const mid = bx + bw / 2
  // Tail base point on bottom edge, clamped to bubble width
  const tbx = Math.max(bx + 12, Math.min(bx + bw - 12, tailX))
  const tby = by + bh

  return (
    <g>
      {narration ? (
        <rect x={bx} y={by} width={bw} height={bh} rx={4}
          fill="#f0ede5" stroke="#888" strokeWidth="1.2" strokeDasharray="4 3" />
      ) : (
        <>
          <rect x={bx} y={by} width={bw} height={bh} rx={10}
            fill="white" stroke="#1a1714" strokeWidth="1.8" />
          {/* Tail */}
          <polygon
            points={`${tbx - 6},${tby} ${tbx + 6},${tby} ${tailX},${tailY}`}
            fill="white" stroke="#1a1714" strokeWidth="1.8" strokeLinejoin="round"
          />
          {/* Overdraw seam */}
          <line x1={tbx - 6} y1={tby} x2={tbx + 6} y2={tby} stroke="white" strokeWidth="2.5" />
        </>
      )}
      {lines.map((l, i) => (
        <text key={i} x={mid} y={by + pad / 2 + 12 + i * LH}
          textAnchor="middle" fontSize="14" fontFamily="'Caveat', cursive"
          fontWeight="600" fill="#1a1714" letterSpacing="0.2">
          {l}
        </text>
      ))}
    </g>
  )
}

function ComicPanel({ panel, svgRef, panelNum }) {
  const { cap, beats } = panel

  // Split beats into left column (A, none) and right column (B, C)
  // Narration boxes span full width — handled separately
  const leftBeats  = beats.filter(b => b.speaker === 'A' || (b.speaker === 'C' && b.side === 'left'))
  const rightBeats = beats.filter(b => b.speaker === 'B' || (b.speaker === 'C' && b.side === 'right'))
  const narrBeats  = beats.filter(b => b.speaker === 'none')

  // Column bubble widths
  const colW = PW / 2 - 12   // ~158px each
  const narrW = PW - 16

  // Which figures appear
  const hasA = beats.some(b => b.speaker === 'A')
  const hasB = beats.some(b => b.speaker === 'B')
  const hasC = beats.some(b => b.speaker === 'C')

  // Dominant emotion per figure
  const lastEmotion = (id) => {
    const last = [...beats].reverse().find(b => b.speaker === id)
    return last?.emotion || 'flat'
  }

  // Layout: stack narration boxes at top, then left/right columns below
  const MARGIN = 5
  const LH = 16
  const getBubbleH = (lines) => lines.length * LH + 10

  // Narration block heights
  let narrBottom = MARGIN
  const narrElems = narrBeats.map((b) => {
    const lines = wrapText(b.text, narrW - 16)
    const bh = getBubbleH(lines)
    const by = narrBottom
    narrBottom += bh + 4
    const elem = <Bubble key={`n-${by}`} lines={lines} bx={8} by={by} bw={narrW} tailX={0} tailY={0} narration />
    return elem
  })

  // Left column — A speaker, bx=5
  let leftY = narrBottom + 3
  const leftElems = leftBeats.map((b, i) => {
    const lines = wrapText(b.text, colW - 14)
    const bh = getBubbleH(lines)
    const bx = 5, bw = colW
    const by = leftY
    leftY += bh + 5
    return (
      <Bubble key={`l-${i}`} lines={lines} bx={bx} by={by} bw={bw}
        tailX={FX.A} tailY={HEAD_Y - HEAD_R - 2} narration={false} />
    )
  })

  // Right column — B speaker, bx = PW/2 + 6
  let rightY = narrBottom + 3
  const rightElems = rightBeats.map((b, i) => {
    const lines = wrapText(b.text, colW - 14)
    const bh = getBubbleH(lines)
    const bx = PW / 2 + 7, bw = colW - 4
    const by = rightY
    rightY += bh + 5
    return (
      <Bubble key={`r-${i}`} lines={lines} bx={bx} by={by} bw={bw}
        tailX={FX.B} tailY={HEAD_Y - HEAD_R - 2} narration={false} />
    )
  })

  const capH = cap ? CAP_H : 0

  return (
    <svg ref={svgRef} viewBox={`0 0 ${PW} ${PH}`} xmlns="http://www.w3.org/2000/svg">
      {/* Paper background */}
      <rect width={PW} height={PH} fill="#faf8f2" />

      {/* Panel number */}
      <text x={PW - 6} y={13} textAnchor="end" fontSize="10"
        fontFamily="'IBM Plex Mono', monospace" fill="#c8c0b0">{panelNum}</text>

      {/* Bubbles */}
      {narrElems}
      {leftElems}
      {rightElems}

      {/* Figures */}
      {hasA && <Figure x={FX.A} emotion={lastEmotion('A')} facing={1} />}
      {hasB && <Figure x={FX.B} emotion={lastEmotion('B')} facing={-1} />}
      {hasC && <Figure x={FX.C} emotion={lastEmotion('C')} facing={1} />}

      {/* Ground line */}
      <line x1={0} y1={FEET_Y + 4} x2={PW} y2={FEET_Y + 4} stroke="#d8d0c0" strokeWidth="1" />

      {/* Caption */}
      {cap && (
        <>
          <rect x={0} y={PH - capH} width={PW} height={capH} fill="#e6dfc8" />
          <line x1={0} y1={PH - capH} x2={PW} y2={PH - capH} stroke="#1a1714" strokeWidth="1" />
          <text x={PW / 2} y={PH - 6} textAnchor="middle" fontSize="13"
            fontFamily="'Caveat', cursive" fontWeight="600" fill="#1a1714" fontStyle="italic">{cap}</text>
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

// ─── Storage ──────────────────────────────────────────────────────────────────
const COMIC_WEEK_KEY = `ops-comic-week:${ISO_WEEK}`
function loadComicOverride() { try { return JSON.parse(localStorage.getItem(COMIC_WEEK_KEY) ?? 'null') } catch { return null } }
function saveComicOverride(i) { try { localStorage.setItem(COMIC_WEEK_KEY, JSON.stringify(i)) } catch {} }

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [feed, setFeed] = useState(null)
  const [feedError, setFeedError] = useState(null)
  const [comics, setComics] = useState(null)

  const pool = comics || COMICS
  const defaultIdx = ISO_WEEK % pool.length
  const [override, setOverride] = useState(loadComicOverride)
  const comicIdx = override ?? defaultIdx
  const strip = pool[comicIdx]

  const svgRefs = [useRef(), useRef(), useRef(), useRef()]

  useEffect(() => {
    fetch('/feed.json').then(r => r.json()).then(setFeed).catch(e => setFeedError(e.message))
  }, [])
  useEffect(() => {
    fetch('/comics.json').then(r => r.json()).then(d => setComics(d)).catch(() => {})
  }, [])

  const shuffle = useCallback(() => {
    let n = comicIdx
    while (pool.length > 1 && n === comicIdx) n = Math.floor(Math.random() * pool.length)
    setOverride(n); saveComicOverride(n)
  }, [pool, comicIdx])

  const revert = useCallback(() => {
    setOverride(null); try { localStorage.removeItem(COMIC_WEEK_KEY) } catch {}
  }, [])

  const saveJpg = useCallback(async () => {
    const scale = 2
    const canvas = document.createElement('canvas')
    const titleH = 48 * scale
    canvas.width = PW * scale * 2 + 4 * scale
    canvas.height = titleH + PH * scale * 2 + 4 * scale
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#1a1714'; ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#f4eede'
    ctx.font = `bold ${15 * scale}px 'Bricolage Grotesque', sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(`${strip.title.toUpperCase()}  ·  STRIP #${comicIdx + 1}  ·  WEEK ${ISO_WEEK}`, canvas.width / 2, 30 * scale)
    for (let i = 0; i < 4; i++) {
      const col = i % 2, row = Math.floor(i / 2)
      const el = svgRefs[i].current; if (!el) continue
      const clone = el.cloneNode(true)
      clone.setAttribute('width', PW * scale); clone.setAttribute('height', PH * scale)
      const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }))
      await new Promise(resolve => {
        const img = new Image()
        img.onload = () => { ctx.drawImage(img, col * (PW * scale + 4 * scale), titleH + row * (PH * scale + 4 * scale), PW * scale, PH * scale); URL.revokeObjectURL(url); resolve() }
        img.onerror = resolve; img.src = url
      })
    }
    const slug = strip.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/jpeg', 0.92)
    a.download = `comic-week-${ISO_WEEK}-${slug}.jpg`; a.click()
  }, [strip, comicIdx])

  const SEV = { high: 0, medium: 1, low: 2 }
  const allItems = feed?.items ?? []
  const actionable = allItems.filter(i => i.actionable).sort((a, b) => (SEV[a.severity] ?? 3) - (SEV[b.severity] ?? 3))
  const rest = allItems.filter(i => !i.actionable)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      <div className="console-wrap">

        {/* ── Header ── */}
        <div className="hdr-kicker">Security Operations</div>
        <div className="hdr-title">OPS <span>CONSOLE</span></div>
        <div className="hdr-sub">
          <span>Week {ISO_WEEK} · w/c {WEEK_MONDAY} · Identity &amp; Access</span>
          <span className="spof-badge"><span className="spof-dot" />SPOF: 1 (you)</span>
        </div>

        {/* ── Comic — TOP ── */}
        <div className="section-label comic-label">Comic of the week</div>
        {strip && (<>
          <div className="comic-header">
            <span className="comic-title-text">{strip.title}</span>
            <span className="comic-strip-label">Strip #{comicIdx + 1} of {pool.length} · Week {ISO_WEEK}</span>
          </div>
          <div className="comic-actions">
            <button className="btn" onClick={shuffle}>⇄ Shuffle</button>
            {override !== null && <button className="btn" onClick={revert}>↺ Week's pick</button>}
            <button className="btn" onClick={saveJpg}>↓ Save as JPG</button>
          </div>
          <div className="comic-grid">
            {strip.panels.map((panel, i) => (
              <div key={i} className="comic-panel">
                <ComicPanel panel={panel} svgRef={svgRefs[i]} panelNum={i + 1} />
              </div>
            ))}
          </div>
        </>)}

        {/* ── Feed ── */}
        {feed?.generatedAt && (
          <div className="feed-meta">
            Updated {new Date(feed.generatedAt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · weekly auto-refresh
          </div>
        )}
        {!feed && !feedError && (<>
          <div className="section-label action">Action required</div>
          <SkeletonCard /><SkeletonCard />
          <div className="section-label">Latest in your area</div>
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </>)}
        {feedError && <div className="error-card" style={{ marginTop: 24 }}><strong>Could not load feed:</strong> {feedError}</div>}
        {feed && (<>
          <div className="section-label action">Action required</div>
          {actionable.length === 0
            ? <div className="empty-card">No urgent action items — check back after Monday's update.</div>
            : actionable.map((item, i) => <NewsCard key={i} item={item} />)}
          <div className="section-label">Latest in your area</div>
          {rest.length === 0
            ? <div className="empty-card">No other items this week.</div>
            : rest.map((item, i) => <NewsCard key={i} item={item} />)}
        </>)}

      </div>
    </>
  )
}
