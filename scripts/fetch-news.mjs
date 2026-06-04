import { writeFileSync, mkdirSync } from 'fs'

const IAM_QUERY =
  'IAM OR "identity and access management" OR "zero trust" OR "privileged access" OR SSPR OR MFA'

const apiKey = process.env.NEWS_API_KEY
if (!apiKey) {
  console.error('ERROR: NEWS_API_KEY secret is not set.')
  process.exit(1)
}

const from = new Date()
from.setDate(from.getDate() - 7)

const url = new URL('https://newsapi.org/v2/everything')
url.searchParams.set('q', IAM_QUERY)
url.searchParams.set('from', from.toISOString().split('T')[0])
url.searchParams.set('sortBy', 'publishedAt')
url.searchParams.set('language', 'en')
url.searchParams.set('pageSize', '30')

const response = await fetch(url.toString(), {
  headers: { 'X-Api-Key': apiKey },
})

if (!response.ok) {
  console.error(`NewsAPI error ${response.status}: ${await response.text()}`)
  process.exit(1)
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

mkdirSync('public', { recursive: true })
writeFileSync(
  'public/articles.json',
  JSON.stringify({ articles, fetchedAt: new Date().toISOString() }, null, 2)
)
console.log(`Saved ${articles.length} articles to public/articles.json`)

function categorise(text) {
  const t = text.toLowerCase()
  if (/breach|leak|expos|stolen|hack|comprom|incident/.test(t)) return 'breach'
  if (/policy|compliance|regulation|nist|iso|gdpr|hipaa|audit/.test(t)) return 'policy'
  if (/tool|sdk|api|release|launch|open.?source|platform/.test(t)) return 'tool'
  return 'other'
}
