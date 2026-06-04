import { useState, useEffect } from 'react'

const WEEK_LABEL = (() => {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - now.getDay())
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`
})()

function ArticleCard({ article }) {
  const published = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <article style={styles.card}>
      <div style={styles.cardMeta}>
        <span style={styles.source}>{article.source?.name ?? 'Unknown'}</span>
        {published && <span style={styles.date}>{published}</span>}
      </div>
      <a href={article.url} target="_blank" rel="noopener noreferrer" style={styles.cardTitle}>
        {article.title}
      </a>
      {article.description && (
        <p style={styles.cardDesc}>{article.description}</p>
      )}
    </article>
  )
}

function StatusBadge({ label, color }) {
  return (
    <span style={{ ...styles.badge, background: color }}>
      {label}
    </span>
  )
}

export default function App() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/news')
      .then((r) => {
        if (!r.ok) throw new Error(`API error ${r.status}`)
        return r.json()
      })
      .then((data) => {
        setArticles(data.articles ?? [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const categories = [
    { key: 'all', label: 'All' },
    { key: 'breach', label: 'Breaches' },
    { key: 'policy', label: 'Policy' },
    { key: 'tool', label: 'Tools' },
  ]

  const filtered =
    filter === 'all'
      ? articles
      : articles.filter((a) =>
          (a.category ?? '').toLowerCase() === filter
        )

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Weekly IAM Brief</h1>
          <p style={styles.subtitle}>{WEEK_LABEL}</p>
        </div>
        <div style={styles.badges}>
          <StatusBadge label="Identity" color="#2d6a4f" />
          <StatusBadge label="Access" color="#1a4971" />
          <StatusBadge label="Management" color="#4a1942" />
        </div>
      </header>

      <nav style={styles.nav}>
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            style={{
              ...styles.filterBtn,
              ...(filter === c.key ? styles.filterBtnActive : {}),
            }}
          >
            {c.label}
          </button>
        ))}
      </nav>

      <main style={styles.main}>
        {loading && (
          <div style={styles.center}>
            <div style={styles.spinner} />
            <p style={{ marginTop: 16, color: '#718096' }}>Loading this week's brief…</p>
          </div>
        )}

        {error && (
          <div style={styles.errorBox}>
            <strong>Could not load articles</strong>
            <p style={{ marginTop: 8, fontSize: 14 }}>{error}</p>
            <p style={{ marginTop: 8, fontSize: 13, color: '#a0aec0' }}>
              Make sure <code>NEWS_API_KEY</code> is set in your environment.
            </p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p style={styles.empty}>No articles found for this filter.</p>
        )}

        <div style={styles.grid}>
          {filtered.map((article, i) => (
            <ArticleCard key={article.url ?? i} article={article} />
          ))}
        </div>
      </main>

      <footer style={styles.footer}>
        Weekly IAM Brief · Powered by NewsAPI
      </footer>
    </div>
  )
}

const styles = {
  page: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '0 16px 48px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
    padding: '32px 0 24px',
    borderBottom: '1px solid #2d3748',
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#f7fafc',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#718096',
  },
  badges: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  badge: {
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    color: '#e2e8f0',
  },
  nav: {
    display: 'flex',
    gap: 8,
    padding: '20px 0',
  },
  filterBtn: {
    padding: '6px 14px',
    borderRadius: 6,
    border: '1px solid #2d3748',
    background: 'transparent',
    color: '#a0aec0',
    cursor: 'pointer',
    fontSize: 14,
  },
  filterBtnActive: {
    background: '#2d3748',
    color: '#f7fafc',
    borderColor: '#4a5568',
  },
  main: {
    marginTop: 8,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 16,
  },
  card: {
    background: '#1a202c',
    border: '1px solid #2d3748',
    borderRadius: 10,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  cardMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    color: '#718096',
  },
  source: {
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  date: {},
  cardTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#e2e8f0',
    lineHeight: 1.4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#a0aec0',
    lineHeight: 1.6,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '64px 0',
  },
  spinner: {
    width: 36,
    height: 36,
    border: '3px solid #2d3748',
    borderTop: '3px solid #63b3ed',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorBox: {
    background: '#2d1b1b',
    border: '1px solid #742a2a',
    borderRadius: 10,
    padding: 20,
    color: '#feb2b2',
    marginBottom: 24,
  },
  empty: {
    color: '#718096',
    padding: '48px 0',
    textAlign: 'center',
  },
  footer: {
    marginTop: 48,
    paddingTop: 24,
    borderTop: '1px solid #2d3748',
    fontSize: 13,
    color: '#4a5568',
    textAlign: 'center',
  },
}
