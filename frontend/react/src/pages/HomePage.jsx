import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import players from '../data/players'

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [message, setMessage] = useState('')
  const formRef = useRef(null)
  const navigate = useNavigate()

  // Build suggestions as user types — same logic as search.js
  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return }

    const q = query.trim().toLowerCase()
    let matches = players.filter(p => p.name.toLowerCase().includes(q))

    matches.sort((a, b) => {
      const aName = a.name.toLowerCase()
      const bName = b.name.toLowerCase()
      const aStarts = aName.startsWith(q)
      const bStarts = bName.startsWith(q)
      const aFirst = aName.split(' ')[0].startsWith(q)
      const bFirst = bName.split(' ')[0].startsWith(q)
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1
      if (aFirst && !bFirst) return -1
      if (!aFirst && bFirst) return 1
      return aName.indexOf(q) - bName.indexOf(q)
    })

    setSuggestions(matches)
  }, [query])

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (formRef.current && !formRef.current.contains(e.target)) {
        setSuggestions([])
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    const q = query.trim().toLowerCase()
    const found = players.find(p => p.name.toLowerCase() === q)
    if (found) {
      navigate(`/player/${found.id}`)
    } else {
      setMessage('Player not found. Try selecting a suggested player.')
      setSuggestions([])
    }
  }

  function handleSuggestionClick(player) {
    setSuggestions([])
    setMessage('')
    navigate(`/player/${player.id}`)
  }

  return (
    <main className="container">
      {/* ── Hero / Search ── */}
      <section className="hero">
        <div className="hero-card">
          <h1>NBA Player Performance Predictor</h1>
          <p>Browse player profiles and mock prediction pages.</p>

          <form
            className="search"
            ref={formRef}
            onSubmit={handleSubmit}
            aria-label="Player search form"
          >
            <div className="search-box">
              <span className="search-icon" aria-hidden="true">🔎</span>
              <input
                className="search-input"
                type="text"
                placeholder="Search players (e.g., LeBron James, Kyrie Irving)…"
                autoComplete="off"
                value={query}
                onChange={e => { setQuery(e.target.value); setMessage('') }}
              />
              <button className="search-btn" type="submit">Search</button>
            </div>

            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
              <div className="suggestions">
                {suggestions.map(p => (
                  <div
                    key={p.id}
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(p)}
                  >
                    {p.name}
                  </div>
                ))}
              </div>
            )}

            <p className="search-hint">Search for a featured player to open their prediction page.</p>
            {message && <p className="search-message">{message}</p>}
          </form>
        </div>
      </section>

      {/* ── Featured Players ── */}
      <section id="players" className="players-section">
        <h2 className="section-title-home">Featured Players</h2>

        <div className="player-grid">
          {players.map(player => (
            <article key={player.id} className="player-card">
              <div className="player-image">
                <img src={player.image} alt={player.name} />
              </div>
              <div className="player-content">
                <h3>{player.name}</h3>
                <p>{player.team} • {player.position}</p>
                <div className="btn-row">
                  <a
                    className="btn primary"
                    href={`/player/${player.id}`}
                    onClick={e => { e.preventDefault(); navigate(`/player/${player.id}`) }}
                  >
                    View Profile
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="footer">StaxNYC Predictor • Player Search Feature</footer>
    </main>
  )
}
