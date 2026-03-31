import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import mockPlayers from '../data/players'

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [message, setMessage] = useState('')
  const formRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return }
    const q = query.trim().toLowerCase()
    const matches = mockPlayers.filter(p =>
      p.name.toLowerCase().includes(q)
    )
    setSuggestions(matches)
  }, [query])

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
    const found = mockPlayers.find(p => p.name.toLowerCase() === q)
    if (found) {
      navigate('/player/' + found.id)
    } else {
      setMessage('Player not found. Try selecting a suggested player.')
      setSuggestions([])
    }
  }

  return (
    <main className="container">
      <section className="hero">
        <div className="hero-card">
          <h1>NBA Player Performance Predictor</h1>
          <p>Browse player profiles and mock prediction pages.</p>
          <form className="search" ref={formRef} onSubmit={handleSubmit}>
            <div className="search-box">
              <span className="search-icon">🔎</span>
              <input
                className="search-input"
                type="text"
                placeholder="Search players (e.g., LeBron James, Kyrie Irving)..."
                autoComplete="off"
                value={query}
                onChange={e => { setQuery(e.target.value); setMessage('') }}
              />
              <button className="search-btn" type="submit">Search</button>
            </div>
            {suggestions.length > 0 && (
              <div className="suggestions">
                {suggestions.map(p => (
                  <div key={p.id} className="suggestion-item"
                    onClick={() => { setSuggestions([]); navigate('/player/' + p.id) }}>
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

      <section id="players" className="players-section">
        <h2 className="section-title-home">Featured Players</h2>
        <div className="player-grid">
          {mockPlayers.map(player => (
            <article key={player.id} className="player-card">
              <div className="player-image">
                <img src={player.image} alt={player.name} />
              </div>
              <div className="player-content">
                <h3>{player.name}</h3>
                <div className="btn-row">
                  <button className="btn primary"
                    onClick={() => navigate('/player/' + player.id)}>
                    View Profile
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="footer">StaxNYC Predictor - Player Search Feature</footer>
    </main>
  )
}
