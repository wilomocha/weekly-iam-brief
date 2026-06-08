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

  /* Shimmer */
  .shimmer { background: linear-gradient(90deg, var(--panel) 25%, #1e2530 50%, var(--panel) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 4px; }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .skel-line { height: 12px; margin-bottom: 8px; border-radius: 3px; }

  /* Error / empty */
  .error-card { background: rgba(248,115,107,0.08); border: 1px solid rgba(248,115,107,0.3); border-radius: 8px; padding: 16px; color: var(--red); margin-bottom: 10px; }
  .empty-card { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 24px; color: var(--muted); text-align: center; margin-bottom: 10px; font-size: 12px; }

  /* Comic section */
  .comic-section { margin-top: 36px; }
  .comic-header { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
  .comic-title-text { font-family: var(--font-display); font-size: 22px; font-weight: 700; color: var(--paper); }
  .comic-strip-label { font-size: 11px; color: var(--muted); }
  .comic-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
  .comic-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    border: 3px solid #1c1a16;
    border-radius: 4px;
    overflow: hidden;
    background: #1c1a16;
    box-shadow: 0 4px 24px rgba(0,0,0,0.5);
  }
  .comic-panel { position: relative; }
  .comic-panel svg { display: block; width: 100%; height: auto; }
  .comic-panel:nth-child(1) { border-right: 1.5px solid #1c1a16; border-bottom: 1.5px solid #1c1a16; }
  .comic-panel:nth-child(2) { border-left: 1.5px solid #1c1a16; border-bottom: 1.5px solid #1c1a16; }
  .comic-panel:nth-child(3) { border-right: 1.5px solid #1c1a16; border-top: 1.5px solid #1c1a16; }
  .comic-panel:nth-child(4) { border-left: 1.5px solid #1c1a16; border-top: 1.5px solid #1c1a16; }

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

// ─── Comic strip data ─────────────────────────────────────────────────────────
// Each strip: { title, premise, panels: [4] }
// Each panel: { cap?: string, beats: [{ speaker: 'A'|'B'|'C'|'none', text, emotion: 'flat'|'worried'|'angry'|'happy'|'shocked' }] }
// 'none' = narration box instead of speech bubble
const COMICS = [
  {
    title: 'Break Glass Theater',
    premise: 'The emergency break-glass account is locked behind the same approval workflow it exists to bypass.',
    panels: [
      { cap: null, beats: [
        { speaker: 'B', side: 'right', text: 'Break-glass is for real emergencies only.', emotion: 'flat' },
        { speaker: 'A', side: 'left', text: 'Understood.', emotion: 'flat' },
      ]},
      { cap: '3am. Production down.', beats: [
        { speaker: 'A', side: 'left', text: 'This is a real emergency. Break-glass time.', emotion: 'worried' },
      ]},
      { cap: null, beats: [
        { speaker: 'B', side: 'right', text: 'To access break-glass, submit form CF-44B and wait for approver.', emotion: 'flat' },
        { speaker: 'A', side: 'left', text: 'But— that\'s what break-glass bypasses—', emotion: 'shocked' },
      ]},
      { cap: null, beats: [
        { speaker: 'B', side: 'right', text: 'Approval SLA: 48 hours.', emotion: 'flat' },
        { speaker: 'A', side: 'left', text: 'The irony is loud.', emotion: 'angry' },
      ]},
    ],
  },
  {
    title: 'Permission Inheritance',
    premise: 'A dev accumulates access every time they change teams and nobody ever cleans it up.',
    panels: [
      { cap: 'Joined team A', beats: [
        { speaker: 'none', side: null, text: 'Got read access to staging.', emotion: 'flat' },
      ]},
      { cap: 'Moved to team B', beats: [
        { speaker: 'none', side: null, text: 'Got prod write. Kept team A access.', emotion: 'flat' },
      ]},
      { cap: 'Moved to team C', beats: [
        { speaker: 'none', side: null, text: 'Got billing admin. Kept everything else.', emotion: 'flat' },
      ]},
      { cap: 'Annual audit', beats: [
        { speaker: 'B', side: 'right', text: 'You have more access than the CEO.', emotion: 'worried' },
        { speaker: 'A', side: 'left', text: 'I\'ve never cleaned anything up.', emotion: 'flat' },
        { speaker: 'B', side: 'right', text: 'We know.', emotion: 'flat' },
      ]},
    ],
  },
  {
    title: 'The Shared Account',
    premise: 'One database account, 47 users, simultaneous logins from three continents.',
    panels: [
      { cap: null, beats: [
        { speaker: 'A', side: 'left', text: 'Who changed the prod DB password?', emotion: 'worried' },
        { speaker: 'B', side: 'right', text: 'Not me.', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left', text: 'The account has 47 users.', emotion: 'flat' },
        { speaker: 'B', side: 'right', text: 'And 3 simultaneous logins. Different continents.', emotion: 'worried' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left', text: 'Can we trace who did it?', emotion: 'flat' },
        { speaker: 'B', side: 'right', text: 'The audit trail just says "db_shared_user".', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left', text: 'Has it always been like this?', emotion: 'worried' },
        { speaker: 'B', side: 'right', text: 'Since 2015.', emotion: 'flat' },
        { speaker: 'A', side: 'left', text: 'Cool.', emotion: 'flat' },
      ]},
    ],
  },
  {
    title: 'Credential Archaeology',
    premise: 'A file named "TEMP_PASSWORDS_DELETE_THIS.xlsx" from 2016 is found on 12 backup drives.',
    panels: [
      { cap: null, beats: [
        { speaker: 'A', side: 'left', text: 'Found: TEMP_PASSWORDS_DELETE_THIS.xlsx', emotion: 'flat' },
        { speaker: 'B', side: 'right', text: 'From when?', emotion: 'flat' },
        { speaker: 'A', side: 'left', text: '2016.', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'B', side: 'right', text: 'Every password we\'ve ever used. 847 rows.', emotion: 'shocked' },
        { speaker: 'A', side: 'left', text: 'On 12 backup drives.', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'B', side: 'right', text: 'Are any of these still active?', emotion: 'worried' },
      ]},
      { cap: '…pause…', beats: [
        { speaker: 'A', side: 'left', text: 'Yes.', emotion: 'flat' },
        { speaker: 'B', side: 'right', text: 'How many?', emotion: 'shocked' },
        { speaker: 'A', side: 'left', text: 'All of them.', emotion: 'flat' },
      ]},
    ],
  },
  {
    title: 'MFA Debt Spiral',
    premise: 'Employee loses their phone. IT policy requires 14 business days to reset MFA. Everything requires MFA.',
    panels: [
      { cap: null, beats: [
        { speaker: 'A', side: 'left', text: 'I lost my phone. Need MFA reset.', emotion: 'worried' },
        { speaker: 'B', side: 'right', text: 'Policy: 14 business days + in-person ID.', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left', text: 'My laptop requires MFA to unlock.', emotion: 'worried' },
        { speaker: 'B', side: 'right', text: 'Right.', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left', text: 'Email requires MFA to access the form.', emotion: 'angry' },
        { speaker: 'B', side: 'right', text: 'Also right.', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left', text: 'How do I work for 14 days?', emotion: 'shocked' },
        { speaker: 'B', side: 'right', text: 'You don\'t.', emotion: 'flat' },
        { speaker: 'A', side: 'left', text: 'Policy is policy.', emotion: 'flat' },
      ]},
    ],
  },
  {
    title: 'Role Roulette',
    premise: '"Database Admin" role now grants Slack admin, GitHub admin, and printer admin. Nobody knows why.',
    panels: [
      { cap: null, beats: [
        { speaker: 'A', side: 'left', text: 'Why does "DB Admin" have Slack admin?', emotion: 'flat' },
        { speaker: 'B', side: 'right', text: 'Legacy reasons.', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left', text: 'And GitHub admin? And printer admin?', emotion: 'worried' },
        { speaker: 'B', side: 'right', text: 'Someone needed access once. Easier to add.', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left', text: 'In 2017?', emotion: 'flat' },
        { speaker: 'B', side: 'right', text: 'We\'ve been adding ever since.', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left', text: 'This isn\'t a role. It\'s a wishlist.', emotion: 'angry' },
        { speaker: 'B', side: 'right', text: '…yes.', emotion: 'flat' },
      ]},
    ],
  },
  {
    title: 'Least Privilege Paradox',
    premise: 'Devs have no prod access for security. Production breaks. They can\'t see the logs to fix it.',
    panels: [
      { cap: null, beats: [
        { speaker: 'A', side: 'left', text: 'Prod is broken. I need to check the logs.', emotion: 'worried' },
        { speaker: 'B', side: 'right', text: 'No prod access for devs. Security policy.', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left', text: 'Can YOU check?', emotion: 'flat' },
        { speaker: 'B', side: 'right', text: 'Submit a ticket. SLA: 4 hours.', emotion: 'flat' },
        { speaker: 'A', side: 'left', text: 'It\'s down NOW.', emotion: 'angry' },
      ]},
      { cap: '4 hours later', beats: [
        { speaker: 'B', side: 'right', text: 'Access approved. What do you need?', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left', text: 'I already fixed it. Guessed and restarted.', emotion: 'flat' },
        { speaker: 'B', side: 'right', text: 'Very secure.', emotion: 'flat' },
        { speaker: 'A', side: 'left', text: 'Very.', emotion: 'flat' },
      ]},
    ],
  },
  {
    title: 'The sudo !! Incident',
    premise: 'Junior dev escalates the wrong command with sudo !! and becomes a legend in the incident report.',
    panels: [
      { cap: null, beats: [
        { speaker: 'A', side: 'left', text: 'I typed sudo !! by accident.', emotion: 'worried' },
        { speaker: 'B', side: 'right', text: 'What was the previous command?', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left', text: 'rm -rf /', emotion: 'shocked' },
      ]},
      { cap: '…', beats: [
        { speaker: 'B', side: 'right', text: '…', emotion: 'shocked' },
        { speaker: 'A', side: 'left', text: '…', emotion: 'shocked' },
      ]},
      { cap: null, beats: [
        { speaker: 'B', side: 'right', text: 'Call backups. Now.', emotion: 'angry' },
        { speaker: 'A', side: 'left', text: 'It\'s probably fine.', emotion: 'worried' },
        { speaker: 'B', side: 'right', text: 'It is not fine.', emotion: 'angry' },
      ]},
    ],
  },
  {
    title: 'Approver Roulette',
    premise: 'Access request bounces between approvers for 3 weeks. Auto-closes after 30 days with no action.',
    panels: [
      { cap: 'Week 1', beats: [
        { speaker: 'none', side: null, text: 'Request sent to Alice.', emotion: 'flat' },
        { speaker: 'A', side: 'left', text: 'Ask Bob.', emotion: 'flat' },
      ]},
      { cap: 'Week 2', beats: [
        { speaker: 'none', side: null, text: 'Sent to Bob.', emotion: 'flat' },
        { speaker: 'B', side: 'right', text: 'Ask Carol.', emotion: 'flat' },
        { speaker: 'none', side: null, text: 'Carol: ask Alice.', emotion: 'flat' },
      ]},
      { cap: 'Week 3', beats: [
        { speaker: 'A', side: 'left', text: 'Alice is on sabbatical.', emotion: 'flat' },
      ]},
      { cap: 'Day 30', beats: [
        { speaker: 'none', side: null, text: 'REQUEST AUTO-CLOSED: No Response.', emotion: 'flat' },
        { speaker: 'B', side: 'right', text: 'I\'ll resubmit.', emotion: 'worried' },
        { speaker: 'A', side: 'left', text: 'See you in month two.', emotion: 'flat' },
      ]},
    ],
  },
  {
    title: 'Compliance Theater',
    premise: 'Annual access review. Manager approves everything in 3 minutes without reading any of it.',
    panels: [
      { cap: 'Access Review Day', beats: [
        { speaker: 'none', side: null, text: 'Certify your permissions are correct.', emotion: 'flat' },
        { speaker: 'B', side: 'right', text: 'Do you know what half these systems are?', emotion: 'worried' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left', text: 'No.', emotion: 'flat' },
        { speaker: 'B', side: 'right', text: 'Are these permissions correct?', emotion: 'flat' },
        { speaker: 'A', side: 'left', text: 'No idea.', emotion: 'flat' },
      ]},
      { cap: '3 minutes later', beats: [
        { speaker: 'A', side: 'left', text: '[Clicks Approve All]', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'none', side: null, text: 'COMPLIANCE SCORE: 100% ✓', emotion: 'flat' },
        { speaker: 'B', side: 'right', text: 'Certified chaos.', emotion: 'flat' },
        { speaker: 'A', side: 'left', text: 'Same time next year.', emotion: 'flat' },
      ]},
    ],
  },
  {
    title: 'Dave Lives On',
    premise: 'Dave left 18 months ago. His admin credentials are in a shared doc his old team still uses.',
    panels: [
      { cap: null, beats: [
        { speaker: 'B', side: 'right', text: 'Did we deprovision Dave? He left 18 months ago.', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left', text: 'Dave has admin on prod, staging, billing, and GitHub.', emotion: 'shocked' },
        { speaker: 'A', side: 'left', text: 'And he logged in last week.', emotion: 'worried' },
      ]},
      { cap: null, beats: [
        { speaker: 'B', side: 'right', text: 'WHAT.', emotion: 'angry' },
        { speaker: 'A', side: 'left', text: 'His creds are in a doc his old team still uses.', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'B', side: 'right', text: 'We\'ve been logging in as Dave for 18 months.', emotion: 'shocked' },
        { speaker: 'A', side: 'left', text: 'Dave lives on.', emotion: 'flat' },
        { speaker: 'B', side: 'right', text: 'Revoke Dave.', emotion: 'angry' },
      ]},
    ],
  },
  {
    title: 'Quick Test Don\'t Mind This',
    premise: 'Developer commits .env file with prod keys to a public repo. Commit message: "quick test don\'t mind this".',
    panels: [
      { cap: null, beats: [
        { speaker: 'B', side: 'right', text: 'Why is our API key rotating every hour?', emotion: 'flat' },
        { speaker: 'A', side: 'left', text: 'Security alert triggered.', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left', text: 'Someone committed a .env to a public repo.', emotion: 'worried' },
        { speaker: 'B', side: 'right', text: 'Commit message?', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'A', side: 'left', text: '"quick test don\'t mind this"', emotion: 'flat' },
      ]},
      { cap: null, beats: [
        { speaker: 'B', side: 'right', text: 'Prod keys, DB passwords, CEO home address.', emotion: 'shocked' },
        { speaker: 'A', side: 'left', text: 'Rotating everything.', emotion: 'worried' },
        { speaker: 'B', side: 'right', text: 'Rotate faster.', emotion: 'angry' },
      ]},
    ],
  },
]

// ─── SVG Comic Panel Renderer ─────────────────────────────────────────────────
const PW = 300, PH = 200

// Wrap text to lines, returns string[]
function wrap(text, maxW, charW = 7) {
  const maxChars = Math.floor(maxW / charW)
  const words = String(text).split(' ')
  const lines = []
  let cur = ''
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w
    if (test.length > maxChars && cur) { lines.push(cur); cur = w }
    else cur = test
  }
  if (cur) lines.push(cur)
  return lines
}

// Figure positions: A=left, B=right, C=center
const FIG_X = { left: 52, right: PW - 52, center: PW / 2 }
const FIG_Y = 130  // foot level
const HEAD_R = 11
const TORSO_H = 34
const LEG_H = 28
const ARM_W = 18

// Emotion → body config
function bodyConfig(emotion) {
  // returns { armLX, armLY, armRX, armRY, legLX, legRY extras[] }
  const mid = 0
  switch (emotion) {
    case 'shocked': return { arms: [[-24, -4, -14, 8], [24, -4, 14, 8]], legs: [[-10, LEG_H], [10, LEG_H]], extras: ['!'] }
    case 'worried': return { arms: [[-20, 2, -10, 12], [20, 2, 10, 12]], legs: [[-9, LEG_H], [9, LEG_H]], extras: [] }
    case 'angry':   return { arms: [[-22, -2, -12, 8], [22, -2, 12, 8]], legs: [[-10, LEG_H], [10, LEG_H]], extras: ['steam'] }
    case 'happy':   return { arms: [[-22, -6, -14, 4], [22, -6, 14, 4]], legs: [[-10, LEG_H], [10, LEG_H]], extras: [] }
    default:        return { arms: [[-18, 6, -10, 14], [18, 6, 10, 14]], legs: [[-9, LEG_H], [9, LEG_H]], extras: [] }
  }
}

// Mouth path based on emotion
function mouth(cx, cy, emotion) {
  if (emotion === 'happy') return `M${cx-5},${cy+1} Q${cx},${cy+6} ${cx+5},${cy+1}`
  if (emotion === 'worried') return `M${cx-5},${cy+4} Q${cx},${cy-1} ${cx+5},${cy+4}`
  if (emotion === 'angry') return `M${cx-5},${cy+4} Q${cx},${cy} ${cx+5},${cy+4}`
  if (emotion === 'shocked') return `M${cx-3},${cy+1} Q${cx},${cy+5} ${cx+3},${cy+1}`
  return `M${cx-5},${cy+2} L${cx+5},${cy+2}` // flat
}

function Figure({ x, emotion = 'flat', facing = 'right' }) {
  const hy = FIG_Y - LEG_H - TORSO_H - HEAD_R * 2
  const headCY = hy + HEAD_R
  const neckY = headCY + HEAD_R
  const hipY = neckY + TORSO_H
  const cfg = bodyConfig(emotion)
  const flip = facing === 'left' ? -1 : 1

  return (
    <g>
      {/* Head */}
      <circle cx={x} cy={headCY} r={HEAD_R} fill="#fbf7ec" stroke="#1c1a16" strokeWidth="1.8" />
      {/* Eyes */}
      <circle cx={x + flip * 3.5} cy={headCY - 2} r={1.4} fill="#1c1a16" />
      <circle cx={x + flip * 7} cy={headCY - 2} r={1.4} fill="#1c1a16" />
      {/* Mouth */}
      <path d={mouth(x + flip * 5, headCY + 4, emotion)} fill="none" stroke="#1c1a16" strokeWidth="1.4" strokeLinecap="round" />
      {/* Neck + torso */}
      <line x1={x} y1={neckY} x2={x} y2={hipY} stroke="#1c1a16" strokeWidth="2" strokeLinecap="round" />
      {/* Arms */}
      {cfg.arms.map(([dx1, dy1, dx2, dy2], i) => {
        const sx = x + flip * Math.abs(dx1) * (i === 0 ? -1 : 1)
        const sy = neckY + TORSO_H * 0.35 + dy1
        const ex = x + flip * Math.abs(dx2) * (i === 0 ? -1 : 1)
        const ey = neckY + TORSO_H * 0.35 + dy2 + 10
        return <line key={i} x1={sx} y1={sy} x2={ex} y2={ey} stroke="#1c1a16" strokeWidth="1.8" strokeLinecap="round" />
      })}
      {/* Legs */}
      {cfg.legs.map(([dx, dy], i) => (
        <line key={i} x1={x} y1={hipY} x2={x + dx} y2={hipY + dy} stroke="#1c1a16" strokeWidth="1.8" strokeLinecap="round" />
      ))}
      {/* Extras */}
      {cfg.extras.includes('!') && (
        <text x={x + flip * 14} y={headCY - 8} fontSize="13" fill="#1c1a16" fontFamily="serif" fontWeight="bold">!</text>
      )}
      {cfg.extras.includes('steam') && (
        <>
          <path d={`M${x+flip*13},${headCY-10} Q${x+flip*15},${headCY-14} ${x+flip*13},${headCY-18}`} fill="none" stroke="#888" strokeWidth="1.2" strokeLinecap="round" />
          <path d={`M${x+flip*17},${headCY-10} Q${x+flip*19},${headCY-14} ${x+flip*17},${headCY-18}`} fill="none" stroke="#888" strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
    </g>
  )
}

// Bubble: speech (round) or narration (rect with no tail)
function Bubble({ text, anchorX, anchorY, side, narration = false }) {
  const maxBW = 140
  const lines = wrap(text, maxBW - 14)
  const lh = 13
  const bh = lines.length * lh + 12
  const bw = Math.min(maxBW, Math.max(56, ...lines.map(l => l.length * 6.5 + 14)))

  let bx
  if (narration) { bx = (PW - bw) / 2 }
  else if (side === 'left') { bx = Math.min(anchorX - 4, PW - bw - 6) }
  else { bx = Math.max(6, anchorX - bw + 4) }
  bx = Math.max(4, Math.min(PW - bw - 4, bx))
  const by = 6

  // Tail anchor point on bubble bottom
  const tailBX = Math.max(bx + 10, Math.min(bx + bw - 10, anchorX))
  const tailTY = by + bh

  return (
    <g>
      {narration ? (
        <rect x={bx} y={by} width={bw} height={bh} rx={3} fill="#fffff4" stroke="#1c1a16" strokeWidth="1.2" strokeDasharray="3,2" />
      ) : (
        <>
          <rect x={bx} y={by} width={bw} height={bh} rx={8} fill="#ffffff" stroke="#1c1a16" strokeWidth="1.5" />
          <polygon
            points={`${tailBX - 5},${tailTY} ${tailBX + 5},${tailTY} ${anchorX},${anchorY - 4}`}
            fill="#ffffff" stroke="#1c1a16" strokeWidth="1.5" strokeLinejoin="round"
          />
          {/* Overdraw to clean up the bubble-tail seam */}
          <line x1={tailBX - 5} y1={tailTY} x2={tailBX + 5} y2={tailTY} stroke="#ffffff" strokeWidth="2" />
        </>
      )}
      {lines.map((l, i) => (
        <text key={i} x={bx + bw / 2} y={by + 11 + i * lh} textAnchor="middle"
          fontSize="9.5" fontFamily="'IBM Plex Mono', monospace" fill="#1c1a16" letterSpacing="-0.2">
          {l}
        </text>
      ))}
    </g>
  )
}

function ComicPanel({ panel, svgRef, panelNum }) {
  const { cap, beats } = panel

  // Layout: figure A always left, B always right, narration centred
  const figures = beats.filter(b => b.speaker !== 'none')
  const hasFigA = figures.some(b => b.speaker === 'A')
  const hasFigB = figures.some(b => b.speaker === 'B')
  const hasFigC = figures.some(b => b.speaker === 'C')

  const figEmotion = (id) => {
    const last = [...beats].reverse().find(b => b.speaker === id)
    return last?.emotion || 'flat'
  }

  const figX = { A: FIG_X.left, B: FIG_X.right, C: FIG_X.center }
  const figFacing = { A: 'right', B: 'left', C: 'right' }

  // Distribute bubbles vertically when there are multiple
  const speechBeats = beats
  const bubbleSlotH = Math.min(48, (PH - 30) / Math.max(1, speechBeats.length))

  const capH = cap ? 18 : 0

  return (
    <svg ref={svgRef} viewBox={`0 0 ${PW} ${PH}`} xmlns="http://www.w3.org/2000/svg">
      {/* Paper bg */}
      <rect width={PW} height={PH} fill="#faf8f2" />
      {/* Subtle ruled lines */}
      {Array.from({ length: 8 }, (_, i) => (
        <line key={i} x1={0} y1={24 + i * 22} x2={PW} y2={24 + i * 22} stroke="#e8e2d4" strokeWidth="0.5" />
      ))}

      {/* Panel number */}
      <text x={PW - 8} y={12} textAnchor="end" fontSize="8" fontFamily="'IBM Plex Mono', monospace" fill="#ccc">{panelNum}</text>

      {/* Speech bubbles — lay out from top */}
      {speechBeats.map((b, i) => {
        const isNarr = b.speaker === 'none'
        const fx = isNarr ? PW / 2 : figX[b.speaker]
        const headTopY = FIG_Y - LEG_H - TORSO_H - HEAD_R * 2 + HEAD_R
        return (
          <Bubble
            key={i}
            text={b.text}
            anchorX={fx}
            anchorY={headTopY - 2}
            side={b.side || 'left'}
            narration={isNarr}
          />
        )
      })}

      {/* Figures */}
      {hasFigA && <Figure x={figX.A} emotion={figEmotion('A')} facing={figFacing.A} />}
      {hasFigB && <Figure x={figX.B} emotion={figEmotion('B')} facing={figFacing.B} />}
      {hasFigC && <Figure x={figX.C} emotion={figEmotion('C')} facing={figFacing.C} />}

      {/* Caption bar */}
      {cap && (
        <>
          <rect x={0} y={PH - capH} width={PW} height={capH} fill="#e4ddc8" />
          <line x1={0} y1={PH - capH} x2={PW} y2={PH - capH} stroke="#1c1a16" strokeWidth="0.8" />
          <text x={PW / 2} y={PH - 5} textAnchor="middle" fontSize="9" fontFamily="'IBM Plex Mono', monospace"
            fill="#1c1a16" fontStyle="italic">{cap}</text>
        </>
      )}
    </svg>
  )
}

// ─── News card ────────────────────────────────────────────────────────────────
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
function loadComicOverride() { try { return JSON.parse(localStorage.getItem(COMIC_WEEK_KEY) ?? 'null') } catch { return null } }
function saveComicOverride(i) { try { localStorage.setItem(COMIC_WEEK_KEY, JSON.stringify(i)) } catch {} }

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [feed, setFeed] = useState(null)
  const [feedError, setFeedError] = useState(null)
  const [comics, setComics] = useState(null)
  const [comicsError, setComicsError] = useState(null)

  const defaultComicIdx = comics ? ISO_WEEK % comics.length : ISO_WEEK % COMICS.length
  const [comicOverride, setComicOverride] = useState(loadComicOverride)
  const comicIdx = comicOverride ?? defaultComicIdx

  const svgRefs = [useRef(), useRef(), useRef(), useRef()]

  useEffect(() => {
    fetch('/feed.json').then(r => r.json()).then(setFeed).catch(e => setFeedError(e.message))
  }, [])
  useEffect(() => {
    fetch('/comics.json').then(r => r.json()).then(setComics).catch(() => setComics(COMICS))
  }, [])

  const shuffleComic = useCallback(() => {
    const pool = comics || COMICS
    let next = comicIdx
    while (pool.length > 1 && next === comicIdx) next = Math.floor(Math.random() * pool.length)
    setComicOverride(next); saveComicOverride(next)
  }, [comics, comicIdx])

  const revertComic = useCallback(() => {
    setComicOverride(null); try { localStorage.removeItem(COMIC_WEEK_KEY) } catch {}
  }, [])

  const saveComicJpg = useCallback(async () => {
    const pool = comics || COMICS
    const strip = pool[comicIdx]
    const scale = 2
    const canvas = document.createElement('canvas')
    const titleH = 44 * scale
    canvas.width = PW * scale * 2 + 4 * scale
    canvas.height = titleH + PH * scale * 2 + 4 * scale
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#1c1a16'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#f4eede'
    ctx.font = `bold ${14 * scale}px 'Bricolage Grotesque', sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(`${strip.title.toUpperCase()}  ·  STRIP #${comicIdx + 1}  ·  WEEK ${ISO_WEEK}`, canvas.width / 2, 28 * scale)
    for (let i = 0; i < 4; i++) {
      const col = i % 2, row = Math.floor(i / 2)
      const el = svgRefs[i].current
      if (!el) continue
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
    a.download = `comic-week-${ISO_WEEK}-${slug}.jpg`
    a.click()
  }, [comics, comicIdx])

  const pool = comics || COMICS
  const strip = pool[comicIdx]
  const SEV_ORDER = { high: 0, medium: 1, low: 2 }
  const allItems = feed?.items ?? []
  const actionable = allItems.filter(i => i.actionable).sort((a, b) => (SEV_ORDER[a.severity] ?? 3) - (SEV_ORDER[b.severity] ?? 3))
  const rest = allItems.filter(i => !i.actionable)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      <div className="console-wrap">

        <div className="hdr-kicker">Security Operations</div>
        <div className="hdr-title">OPS <span>CONSOLE</span></div>
        <div className="hdr-sub">
          <span>Week {ISO_WEEK} · w/c {WEEK_MONDAY} · Identity &amp; Access</span>
          <span className="spof-badge"><span className="spof-dot" />SPOF: 1 (you)</span>
        </div>

        {feed?.generatedAt && (
          <div className="feed-meta">
            Updated {new Date(feed.generatedAt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · weekly auto-refresh
          </div>
        )}

        {!feed && !feedError && (<>
          <div className="section-label action" style={{ marginTop: 28 }}>Action required</div>
          <SkeletonCard /><SkeletonCard />
          <div className="section-label">Latest in your area</div>
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </>)}
        {feedError && <div className="error-card" style={{ marginTop: 24 }}><strong>Could not load feed:</strong> {feedError}</div>}
        {feed && (<>
          <div className="section-label action">Action required</div>
          {actionable.length === 0
            ? <div className="empty-card">No urgent action items this week — check back after Monday's update.</div>
            : actionable.map((item, i) => <NewsCard key={i} item={item} />)}
          <div className="section-label">Latest in your area</div>
          {rest.length === 0
            ? <div className="empty-card">No other items this week.</div>
            : rest.map((item, i) => <NewsCard key={i} item={item} />)}
        </>)}

        <div className="comic-section">
          <div className="section-label">Comic of the week</div>
          {comicsError && <div className="error-card">Could not load comics: {comicsError}</div>}
          {strip && (<>
            <div className="comic-header">
              <span className="comic-title-text">{strip.title}</span>
              <span className="comic-strip-label">Strip #{comicIdx + 1} of {pool.length} · Week {ISO_WEEK}</span>
            </div>
            <div className="comic-actions">
              <button className="btn" onClick={shuffleComic}>⇄ Shuffle</button>
              {comicOverride !== null && <button className="btn" onClick={revertComic}>↺ Week's pick</button>}
              <button className="btn" onClick={saveComicJpg}>↓ Save as JPG</button>
            </div>
            <div className="comic-grid">
              {strip.panels.map((panel, i) => (
                <div key={i} className="comic-panel">
                  <ComicPanel panel={panel} svgRef={svgRefs[i]} panelNum={i + 1} />
                </div>
              ))}
            </div>
          </>)}
        </div>

      </div>
    </>
  )
}
