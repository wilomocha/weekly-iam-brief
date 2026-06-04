const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-5'
const SEV_ORDER = { high: 0, medium: 1, low: 2 }

function sortItems(items) {
  return items.slice().sort((a, b) => {
    if (a.actionable !== b.actionable) return a.actionable ? -1 : 1
    return (SEV_ORDER[a.severity] ?? 3) - (SEV_ORDER[b.severity] ?? 3)
  })
}

function parseItems(text) {
  // Try parsing the whole text as JSON first
  const trimmed = text.trim()
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      if (Array.isArray(parsed.items)) return parsed.items
    } catch {}
  }

  // Fallback: salvage individual item objects with regex
  const items = []
  const objRegex = /\{[^{}]*"title"[^{}]*\}/g
  let m
  while ((m = objRegex.exec(text)) !== null) {
    try {
      const item = JSON.parse(m[0])
      if (item.title) items.push(item)
    } catch {}
  }
  return items
}

function buildPrompt(focus) {
  const today = new Date().toISOString().slice(0, 10)
  return `Today is ${today}. You are a security operations analyst writing a weekly brief for an engineer who is the SOLE owner of their company's identity/access systems. Use web search (run a few different queries) for the most RECENT items (~past 3 weeks) about: ${focus}. Mix: new CVEs/vulnerabilities, vendor advisories/product changes, identity/credential breaches, and authoritative guidance (CISA/NCSC/NIST). Prioritize things this engineer must ACT on. After searching, reply with ONLY compact JSON of the exact shape {"items":[{...}]} (fields: title, summary <=18 words, category vulnerability|breach|vendor|guidance|trend, severity high|medium|low, actionable true|false, action <=10 words or empty, source publisher, url https://…, date YYYY-MM-DD), AT MOST 5 items, highest severity / most actionable first. Keep every string short so the JSON is complete.`
}

async function handleApiNews(request, env) {
  if (!env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured on this Worker' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }

  let focus
  try {
    const body = await request.json()
    focus = body.focus || ''
  } catch {
    focus = ''
  }

  const payload = {
    model: MODEL,
    max_tokens: 1024,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [{ role: 'user', content: buildPrompt(focus) }],
  }

  let anthropicRes
  try {
    anthropicRes = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: `Network error calling Anthropic: ${e.message}` }), {
      status: 502, headers: { 'Content-Type': 'application/json' }
    })
  }

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text()
    return new Response(JSON.stringify({ error: `Anthropic API error ${anthropicRes.status}: ${errText.slice(0, 200)}` }), {
      status: 502, headers: { 'Content-Type': 'application/json' }
    })
  }

  const data = await anthropicRes.json()

  // Concatenate all text blocks
  const text = (data.content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n')

  const items = parseItems(text)

  if (!items.length) {
    return new Response(JSON.stringify({ error: 'No items parsed from model response', raw: text.slice(0, 300) }), {
      status: 502, headers: { 'Content-Type': 'application/json', 'cache-control': 'no-store' }
    })
  }

  return new Response(JSON.stringify({ items: sortItems(items) }), {
    headers: { 'Content-Type': 'application/json', 'cache-control': 'no-store' }
  })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === '/api/news' && request.method === 'POST') {
      return handleApiNews(request, env)
    }

    // Serve static SPA assets; falls back to index.html for client-side routing
    if (env.ASSETS) {
      return env.ASSETS.fetch(request)
    }

    return new Response('Not found', { status: 404 })
  }
}
