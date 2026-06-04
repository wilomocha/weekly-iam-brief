const IAM_QUERY = 'IAM OR "identity and access management" OR "zero trust" OR "privileged access" OR SSPR OR MFA'

export default async function handler(req, res) {
  const apiKey = process.env.NEWS_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'NEWS_API_KEY environment variable is not set.' })
  }

  const from = new Date()
  from.setDate(from.getDate() - 7)
  const fromStr = from.toISOString().split('T')[0]

  const url = new URL('https://newsapi.org/v2/everything')
  url.searchParams.set('q', IAM_QUERY)
  url.searchParams.set('from', fromStr)
  url.searchParams.set('sortBy', 'publishedAt')
  url.searchParams.set('language', 'en')
  url.searchParams.set('pageSize', '30')

  try {
    const response = await fetch(url.toString(), {
      headers: { 'X-Api-Key': apiKey },
    })

    if (!response.ok) {
      const body = await response.text()
      return res.status(response.status).json({ error: body })
    }

    const data = await response.json()

    const articles = (data.articles ?? [])
      .filter((a) => a.title && a.title !== '[Removed]')
      .map((a) => ({
        title: a.title,
        description: a.description,
        url: a.url,
        publishedAt: a.publishedAt,
        source: a.source,
        category: categorise(a.title + ' ' + (a.description ?? '')),
      }))

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600')
    return res.status(200).json({ articles })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

function categorise(text) {
  const t = text.toLowerCase()
  if (/breach|leak|expos|stolen|hack|comprom|incident/.test(t)) return 'breach'
  if (/policy|compliance|regulation|nist|iso|gdpr|hipaa|audit/.test(t)) return 'policy'
  if (/tool|sdk|api|release|launch|open.?source|platform/.test(t)) return 'tool'
  return 'other'
}
